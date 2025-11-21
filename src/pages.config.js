import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import NovoRomaneio from './pages/NovoRomaneio';
import MinhasEntregas from './pages/MinhasEntregas';
import DetalhesRomaneio from './pages/DetalhesRomaneio';
import Rastreamento from './pages/Rastreamento';
import HistoricoClientes from './pages/HistoricoClientes';
import Relatorios from './pages/Relatorios';
import Usuarios from './pages/Usuarios';
import Sedex from './pages/Sedex';
import DetalhesSedex from './pages/DetalhesSedex';
import PainelMotoboys from './pages/PainelMotoboys';
import Balcao from './pages/Balcao';
import Receitas from './pages/Receitas';
import Pagamentos from './pages/Pagamentos';
import PlanilhaDiaria from './pages/PlanilhaDiaria';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clientes": Clientes,
    "NovoRomaneio": NovoRomaneio,
    "MinhasEntregas": MinhasEntregas,
    "DetalhesRomaneio": DetalhesRomaneio,
    "Rastreamento": Rastreamento,
    "HistoricoClientes": HistoricoClientes,
    "Relatorios": Relatorios,
    "Usuarios": Usuarios,
    "Sedex": Sedex,
    "DetalhesSedex": DetalhesSedex,
    "PainelMotoboys": PainelMotoboys,
    "Balcao": Balcao,
    "Receitas": Receitas,
    "Pagamentos": Pagamentos,
    "PlanilhaDiaria": PlanilhaDiaria,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};