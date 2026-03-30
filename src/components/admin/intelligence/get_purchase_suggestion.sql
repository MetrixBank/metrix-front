CREATE OR REPLACE FUNCTION public.get_purchase_suggestion(p_distributor_id uuid, p_investment_points integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
    v_investment_value NUMERIC;
    points_to_currency_rate NUMERIC := 4000; -- Default BRL
    v_start_date DATE := CURRENT_DATE - INTERVAL '6 months';
    team_member_ids UUID[];
    v_total_cost NUMERIC := 0;
    v_projected_revenue NUMERIC := 0;
    suggestions_data JSON;
    v_remaining_budget NUMERIC;
    v_product_record RECORD;
    v_region TEXT;
BEGIN
    -- Check Region to determine point value
    SELECT region INTO v_region FROM public.profiles WHERE id = p_distributor_id;
    
    IF v_region = 'USA' THEN
        points_to_currency_rate := 1000;
    ELSE
        points_to_currency_rate := 4000;
    END IF;

    -- 1. Obter IDs da equipe (se for sub-admin) ou apenas o ID do distribuidor
    SELECT ARRAY(SELECT id FROM public.get_user_descendants_and_self(p_distributor_id)) INTO team_member_ids;

    -- 2. Calcular o valor total do investimento na moeda local
    v_investment_value := p_investment_points * points_to_currency_rate;
    v_remaining_budget := v_investment_value;

    -- 3. Analisar as vendas dos últimos 6 meses para a equipe
    DROP TABLE IF EXISTS temp_sales_proportion;
    CREATE TEMP TABLE temp_sales_proportion AS
    WITH sales_last_6_months AS (
        SELECT
            op.product_id,
            p.name as product_name,
            p.cost_price,
            p.sale_price,
            SUM(op.quantity_sold) as total_quantity_sold
        FROM public.opportunity_products op
        JOIN public.sales_opportunities so ON op.opportunity_id = so.id
        JOIN public.products p ON op.product_id = p.id
        WHERE so.distributor_id = ANY(team_member_ids)
          AND so.status = 'sale_made'
          AND so.visit_date >= v_start_date
          AND p.cost_price > 0 -- Ignora produtos sem custo definido
        GROUP BY op.product_id, p.name, p.cost_price, p.sale_price
    ),
    total_sales AS (
        SELECT SUM(total_quantity_sold) as total_items_sold FROM sales_last_6_months
    )
    SELECT
        product_id,
        product_name,
        cost_price,
        sale_price,
        total_quantity_sold,
        total_quantity_sold / NULLIF((SELECT total_items_sold FROM total_sales), 0) as sales_ratio,
        0::INT as suggested_quantity -- Inicializa a quantidade sugerida
    FROM sales_last_6_months;

    -- Se não houver dados de vendas, retorna um relatório vazio
    IF NOT EXISTS (SELECT 1 FROM temp_sales_proportion) THEN
        RETURN json_build_object(
            'total_cost', 0,
            'projected_revenue', 0,
            'projected_profit', 0,
            'investment_rate_used', points_to_currency_rate,
            'suggestion', '[]'::json
        );
    END IF;

    -- 4. Distribuição inicial do orçamento
    FOR v_product_record IN SELECT * FROM temp_sales_proportion
    LOOP
        IF v_product_record.cost_price > 0 THEN
            DECLARE
                allocated_budget NUMERIC;
                quantity_to_buy INT;
            BEGIN
                allocated_budget := v_investment_value * v_product_record.sales_ratio;
                quantity_to_buy := FLOOR(allocated_budget / v_product_record.cost_price);
                IF quantity_to_buy > 0 THEN
                    UPDATE temp_sales_proportion SET suggested_quantity = quantity_to_buy WHERE product_id = v_product_record.product_id;
                    v_remaining_budget := v_remaining_budget - (quantity_to_buy * v_product_record.cost_price);
                END IF;
            END;
        END IF;
    END LOOP;

    -- 5. Redistribuição do orçamento restante
    -- Adiciona unidades extras dos produtos mais vendidos (por proporção) que o orçamento permitir
    FOR v_product_record IN SELECT * FROM temp_sales_proportion ORDER BY sales_ratio DESC
    LOOP
        IF v_product_record.cost_price <= v_remaining_budget THEN
            DECLARE
                extra_quantity INT;
            BEGIN
                extra_quantity := FLOOR(v_remaining_budget / v_product_record.cost_price);
                IF extra_quantity > 0 THEN
                    UPDATE temp_sales_proportion SET suggested_quantity = suggested_quantity + extra_quantity WHERE product_id = v_product_record.product_id;
                    v_remaining_budget := v_remaining_budget - (extra_quantity * v_product_record.cost_price);
                END IF;
            END;
        END IF;
    END LOOP;
    
    -- 6. Construir o JSON final a partir da tabela temporária
    SELECT 
        json_build_object(
            'total_cost', COALESCE(SUM(ps.suggested_quantity * ps.cost_price), 0),
            'projected_revenue', COALESCE(SUM(ps.suggested_quantity * ps.sale_price), 0),
            'projected_profit', COALESCE(SUM(ps.suggested_quantity * (ps.sale_price - ps.cost_price)), 0),
            'investment_rate_used', points_to_currency_rate,
            'suggestion', COALESCE(json_agg(
                json_build_object(
                    'product_id', ps.product_id,
                    'product_name', ps.product_name,
                    'suggested_quantity', ps.suggested_quantity,
                    'cost_price', ps.cost_price,
                    'sale_price', ps.sale_price,
                    'sales_last_6_months', ps.total_quantity_sold
                )
            ORDER BY ps.suggested_quantity DESC), '[]'::json)
        )
    INTO result
    FROM temp_sales_proportion ps
    WHERE ps.suggested_quantity > 0;
    
    DROP TABLE temp_sales_proportion;

    RETURN result;

END;
$function$