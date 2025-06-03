import { ThemeProvider } from './components/ThemeProvider';
import FamilyTree from './components/FamilyTree';

function App() {
  return (
    <ThemeProvider>
      <FamilyTree />
    </ThemeProvider>
  );
}

export default App;
