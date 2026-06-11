import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import JournalList from "@/pages/JournalList";
import JournalDetail from "@/pages/JournalDetail";
import JournalForm from "@/pages/JournalForm";
import SpeciesGuide from "@/pages/SpeciesGuide";
import SpeciesDetail from "@/pages/SpeciesDetail";
import Statistics from "@/pages/Statistics";
import Equipment from "@/pages/Equipment";
import ExportPage from "@/pages/ExportPage";
import Wishlist from "@/pages/Wishlist";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/journal" element={<JournalList />} />
          <Route path="/journal/new" element={<JournalForm />} />
          <Route path="/journal/:id" element={<JournalDetail />} />
          <Route path="/journal/:id/edit" element={<JournalForm />} />
          <Route path="/species" element={<SpeciesGuide />} />
          <Route path="/species/:id" element={<SpeciesDetail />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Route>
      </Routes>
    </Router>
  );
}
