import AssociationSection from "./Components/AssociationSection";
import CampusSection from "./Components/CampusSection";
import Courses from "./Components/Courses";
import Footer from "./Components/Footer";
import HighlightsSection from "./Components/HighlightsSection";
import IntroSection from "./Components/IntroSection";
import Navbar from "./Components/Navbar";
import NewsAndEvents from "./Components/NewsAndEvents";
import NoticeSection from "./Components/NoticeSection";

function App() {
  return (
    <>
      <Navbar />
      <NoticeSection />
      <Courses />
      <HighlightsSection />
      <IntroSection />
      <AssociationSection />
      <NewsAndEvents />
      <CampusSection />
      <Footer />
    </>
  );
}

export default App;
