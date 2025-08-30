import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, BookOpen, Coins, Shield, ArrowLeft, ArrowRight, Check } from "lucide-react";

const onboardingSlides = [
  {
    id: 1,
    icon: BookOpen,
    title: "Publish & Monetize Stories",
    description: "Share your experiences, creative works, and life lessons. Earn directly from readers through transparent micro-payments - no middlemen, no exploitation.",
    color: "text-primary"
  },
  {
    id: 2,
    icon: Coins,
    title: "Support Women Directly",
    description: "100% of your payments go directly to the authors. Every chapter purchase directly supports South African women's voices and stories.",
    color: "text-empowerment"
  },
  {
    id: 3,
    icon: Shield,
    title: "Micro-payments & Transparency",
    description: "Pay per chapter with clear pricing. See exactly where your money goes and the impact it creates in communities and women's shelters.",
    color: "text-warmth"
  }
];

export const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    navigate('/auth');
  };

  const handleSkip = () => {
    navigate('/');
  };

  const currentSlideData = onboardingSlides[currentSlide];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-empowerment/5 to-warmth/5">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
        <div className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-primary">HerStories</span>
        </div>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-8">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary to-empowerment h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / onboardingSlides.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Step {currentSlide + 1} of {onboardingSlides.length}</span>
          <span>{Math.round(((currentSlide + 1) / onboardingSlides.length) * 100)}%</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-md mx-auto text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`w-20 h-20 bg-gradient-to-br from-primary/10 to-empowerment/10 rounded-full flex items-center justify-center`}>
              <currentSlideData.icon className={`h-10 w-10 ${currentSlideData.color}`} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-foreground">
            {currentSlideData.title}
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground leading-relaxed">
            {currentSlideData.description}
          </p>

          {/* Navigation Dots */}
          <div className="flex justify-center space-x-2">
            {onboardingSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-primary scale-125' 
                    : 'bg-muted hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="p-6">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentSlide === onboardingSlides.length - 1 ? (
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-primary to-empowerment hover:from-primary/90 hover:to-empowerment/90 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          ) : (
            <Button
              onClick={nextSlide}
              className="bg-gradient-to-r from-primary to-empowerment hover:from-primary/90 hover:to-empowerment/90 text-white"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
