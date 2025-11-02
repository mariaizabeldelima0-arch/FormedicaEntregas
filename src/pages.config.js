import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import NovoRomaneio from './pages/NovoRomaneio';
import MinhasEntregas from './pages/MinhasEntregas';
import DetalhesRomaneio from './pages/DetalhesRomaneio';
import Rastreamento from './pages/Rastreamento';
import HistoricoClientes from './pages/HistoricoClientes';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clientes": Clientes,
    "NovoRomaneio": NovoRomaneio,
    "MinhasEntregas": MinhasEntregas,
    "DetalhesRomaneio": DetalhesRomaneio,
    "Rastreamento": Rastreamento,
    "HistoricoClientes": HistoricoClientes,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};