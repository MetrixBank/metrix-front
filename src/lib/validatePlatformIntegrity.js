import { supabase } from '@/lib/supabaseClient';

export const validatePlatformIntegrity = async (distributorId) => {
    console.log("🚀 Iniciando validação de integridade da plataforma...");
    
    if (!distributorId) {
        console.error("❌ ID do distribuidor não fornecido.");
        return;
    }

    let report = {
        duplicates: 0,
        orphanedTasks: 0,
        orphanedOpps: 0,
        totalCustomers: 0,
        totalTasks: 0
    };

    try {
        // 1. Check Duplicates
        const { data: duplicates } = await supabase
            .from('customers')
            .select('name, phone, count')
            .eq('distributor_id', distributorId)
            .group('name, phone'); // Note: simplified check, real group requires aggregation functions or raw sql
        
        // Using manual JS check for detailed breakdown if SQL aggregation is limited via client
        const { data: customers } = await supabase.from('customers').select('*').eq('distributor_id', distributorId);
        report.totalCustomers = customers.length;
        
        const names = customers.map(c => c.name.toLowerCase());
        const uniqueNames = new Set(names);
        if (names.length !== uniqueNames.size) {
            console.warn("⚠️ Possíveis duplicatas de nome encontradas.");
            report.duplicates = names.length - uniqueNames.size;
        }

        // 2. Check Task Integrity
        const { data: tasks } = await supabase.from('ai_assistant_tasks').select('*').eq('distributor_id', distributorId);
        report.totalTasks = tasks.length;
        
        const customerIds = new Set(customers.map(c => c.id));
        const orphans = tasks.filter(t => !customerIds.has(t.customer_id));
        
        if (orphans.length > 0) {
            console.error(`❌ ${orphans.length} Tarefas órfãs encontradas (sem cliente válido).`);
            report.orphanedTasks = orphans.length;
        } else {
            console.log("✅ Integridade de Tarefas: OK");
        }

        // 3. Database Function Check
        const { data: dbCheck, error: dbError } = await supabase.rpc('validate_customer_task_consistency');
        if (dbError) {
            console.error("❌ Erro ao executar verificação no banco:", dbError);
        } else {
            console.log("📊 Relatório do Banco:", dbCheck);
        }

        console.log("🏁 Validação concluída.", report);
        return report;

    } catch (e) {
        console.error("❌ Erro fatal na validação:", e);
    }
};