CREATE OR REPLACE FUNCTION public.get_sales_ranking_for_period(p_start_date date, p_end_date date, p_team_member_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS TABLE(distributor_id uuid, distributor_name text, avatar_url text, total_points numeric, total_revenue numeric, sales_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    points_per_currency_unit CONSTANT NUMERIC := 4000.0;
    cutoff_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    cutoff_timestamp := (p_end_date + interval '1 day')::timestamp at time zone 'UTC' - interval '1 second';

    RETURN QUERY
    SELECT
        p.id as distributor_id,
        p.name as distributor_name,
        p.avatar_url,
        SUM(sub.opp_points) as total_points,
        SUM(sub.sale_value) as total_revenue,
        COUNT(sub.id) as sales_count
    FROM
        public.profiles p
    JOIN (
        SELECT 
            so.id,
            so.distributor_id,
            so.sale_value,
            COALESCE(SUM((op.quantity_sold * op.unit_cost_price_at_sale) / points_per_currency_unit), 0) as opp_points
        FROM public.sales_opportunities so
        JOIN public.opportunity_products op ON so.id = op.opportunity_id
        WHERE 
            so.status = 'sale_made' AND
            so.visit_date >= p_start_date AND
            so.visit_date <= p_end_date AND
            so.created_at <= cutoff_timestamp
        GROUP BY so.id, so.distributor_id, so.sale_value
    ) sub ON p.id = sub.distributor_id
    WHERE
        p.role IN ('distributor', 'sub-admin') AND
        (p_team_member_ids IS NULL OR p.id = ANY(p_team_member_ids))
    GROUP BY
        p.id, p.name, p.avatar_url
    HAVING
        SUM(sub.opp_points) > 0
    ORDER BY
        total_points DESC, p.created_at ASC;
END;
$function$