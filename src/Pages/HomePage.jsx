import React from "react";
import AssociationSection from "../Components/AssociationSection";
import CampusSection from "../Components/CampusSection";
import Courses from "../Components/Courses";

import HighlightsSection from "../Components/HighlightsSection";
import IntroSection from "../Components/IntroSection";

import NewsAndEvents from "../Components/NewsAndEvents";
import NoticeSection from "../Components/NoticeSection";

const HomePage = () => {
  return (
    <>
      <NoticeSection />
      <Courses />
      <HighlightsSection />
      <IntroSection />
      <AssociationSection />
      <NewsAndEvents />
      <CampusSection />
    </>
  );
};

export default HomePage;
