import { useEffect } from "react";
import Portfolio from "../components/Portfolio";

const Plans = () => {
  useEffect(() => {
    const scrollToPlans = () => {
      const el = document.getElementById("plans");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    };

    // Small delay to ensure content is rendered
    const timeout = setTimeout(scrollToPlans, 200);
    return () => clearTimeout(timeout);
  }, []);

  return <Portfolio />;
};

export default Plans;

