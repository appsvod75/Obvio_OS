import { HashRouter } from 'react-router-dom';
import { BarberProvider } from './context/BarberContext';
import { ClientsProvider } from './context/ClientsContext';
import { CatalogProvider } from './context/CatalogContext';
import { PromotionsProvider } from './context/PromotionsContext';
import { AppRoutes } from './components/layout/AppRoutes';

function App() {
  return (
    <HashRouter>
      <ClientsProvider>
        <CatalogProvider>
          <PromotionsProvider>
            <BarberProvider>
              <AppRoutes />
            </BarberProvider>
          </PromotionsProvider>
        </CatalogProvider>
      </ClientsProvider>
    </HashRouter>
  );
}

export default App;
