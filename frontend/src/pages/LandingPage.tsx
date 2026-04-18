import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import TopicsSection from '../components/landing/TopicsSection'
import CTASection from '../components/landing/CTASection'
import Footer from '../components/landing/Footer'

export default function LandingPage() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TopicsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
