import { ThemeProvider } from './components/ThemeProvider';
import FamilyTree from './components/FamilyTree';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
    <Toaster position="top-right" />
    <ThemeProvider>
      <FamilyTree />
    </ThemeProvider>
    </>
  );
}

export default App;
