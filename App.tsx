import { HashRouter } from 'react-router-dom';
import { BarberProvider } from './context/BarberContext';
import { AppRoutes } from './components/layout/AppRoutes';

function App() {
  return (
    <HashRouter>
      <BarberProvider>
        <AppRoutes />
      </BarberProvider>
    </HashRouter>
  );
}

export default App;
