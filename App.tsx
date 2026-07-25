import { HashRouter } from 'react-router-dom';
import { BarberProvider } from './context/BarberContext';
import { ClientsProvider } from './context/ClientsContext';
import { CatalogProvider } from './context/CatalogContext';
import { PromotionsProvider } from './context/PromotionsContext';
import { AgendaProvider } from './context/AgendaContext';
import { StaffProvider } from './context/StaffContext';
import { BranchProvider } from './context/BranchContext';
import { AppRoutes } from './components/layout/AppRoutes';

function App() {
  return (
    <HashRouter>
      <ClientsProvider>
        <CatalogProvider>
          <PromotionsProvider>
            <AgendaProvider>
              <StaffProvider>
                <BranchProvider>
                  <BarberProvider>
              <AppRoutes />
            </BarberProvider>
                </BranchProvider>
              </StaffProvider>
            </AgendaProvider>
          </PromotionsProvider>
        </CatalogProvider>
      </ClientsProvider>
    </HashRouter>
  );
}

export default App;
