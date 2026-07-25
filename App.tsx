import { HashRouter } from 'react-router-dom';
import { BarberProvider } from './context/BarberContext';
import { ClientsProvider } from './context/ClientsContext';
import { CatalogProvider } from './context/CatalogContext';
import { PromotionsProvider } from './context/PromotionsContext';
import { AgendaProvider } from './context/AgendaContext';
import { StaffProvider } from './context/StaffContext';
import { BranchProvider } from './context/BranchContext';
import { ConfigProvider } from './context/ConfigContext';
import { InventoryProvider } from './context/InventoryContext';
import { TicketsProvider } from './context/TicketsContext';
import { SalesProvider } from './context/SalesContext';
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
                  <ConfigProvider>
                    <InventoryProvider>
                      <TicketsProvider>
                        <SalesProvider>
                          <BarberProvider>
              <AppRoutes />
            </BarberProvider>
                        </SalesProvider>
                      </TicketsProvider>
                    </InventoryProvider>
                  </ConfigProvider>
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
