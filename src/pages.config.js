import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import NovoRomaneio from './pages/NovoRomaneio';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clientes": Clientes,
    "NovoRomaneio": NovoRomaneio,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};