import { useState, useCallback } from 'react';

export interface Field {
  id: number;
  name: string;
  crop: string;
  area: number;
  soilType: string;
  soilHealth: string;
  plantingDate: string;
  status: string;
  coordinates: string;
}

export interface Prediction {
  field: string;
  location: string;
  currentYield: number;
  predictedYield: number;
  confidence: number;
  harvest: string;
  factors: string[];
}

export interface Recommendation {
  id: number;
  type: string;
  field: string;
  priority: string;
  title: string;
  description: string;
  action: string;
  timeframe: string;
  confidence: number;
  completed?: boolean;
}

export const useAppState = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState<Field[]>([
    {
      id: 1,
      name: "North Field",
      crop: "Wheat",
      area: 12.5,
      soilType: "Loam",
      soilHealth: "Good", 
      plantingDate: "Oct 15, 2023",
      status: "Growing",
      coordinates: "40.7128°N, 74.0060°W"
    },
    {
      id: 2,
      name: "South Field",
      crop: "Corn",
      area: 8.3,
      soilType: "Clay Loam",
      soilHealth: "Excellent",
      plantingDate: "Nov 2, 2023", 
      status: "Flowering",
      coordinates: "40.7580°N, 73.9855°W"
    },
    {
      id: 3,
      name: "East Field",
      crop: "Wheat",
      area: 15.2,
      soilType: "Sandy Loam",
      soilHealth: "Fair",
      plantingDate: "Oct 22, 2023",
      status: "Vegetative",
      coordinates: "40.7282°N, 74.0776°W"
    }
  ]);

  const [predictions, setPredictions] = useState<Prediction[]>([
    {
      field: "North Field - Wheat",
      location: "Plot A1, 12.5 acres",
      currentYield: 4.2,
      predictedYield: 4.8,
      confidence: 89,
      harvest: "March 15, 2024",
      factors: ["Optimal rainfall", "Good soil nitrogen", "Moderate temperature"]
    },
    {
      field: "South Field - Corn", 
      location: "Plot B2, 8.3 acres",
      currentYield: 6.1,
      predictedYield: 5.7,
      confidence: 82,
      harvest: "April 2, 2024",
      factors: ["Low phosphorus", "High temperature stress", "Irregular irrigation"]
    }
  ]);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: 1,
      type: "Irrigation",
      field: "North Field - Wheat",
      priority: "High",
      title: "Increase irrigation frequency",
      description: "Soil moisture is below optimal levels. Increase watering to 2.5 inches per week for the next 10 days.",
      action: "Water 0.5 inches tomorrow morning",
      timeframe: "Next 24 hours",
      confidence: 94
    },
    {
      id: 2,
      type: "Fertilizer",
      field: "South Field - Corn",
      priority: "Medium",
      title: "Apply nitrogen fertilizer",
      description: "Nitrogen levels are decreasing. Apply 40 lbs/acre of urea fertilizer during early vegetative stage.",
      action: "Schedule fertilizer application",
      timeframe: "Within 3 days",
      confidence: 87
    }
  ]);

  const addField = useCallback((field: Omit<Field, 'id'>) => {
    const newField = {
      ...field,
      id: Math.max(...fields.map(f => f.id)) + 1
    };
    setFields(prev => [...prev, newField]);
  }, [fields]);

  const updateField = useCallback((id: number, updates: Partial<Field>) => {
    setFields(prev => prev.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  }, []);

  const deleteField = useCallback((id: number) => {
    setFields(prev => prev.filter(field => field.id !== id));
  }, []);

  const runPrediction = useCallback(async () => {
    setIsLoading(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate new predictions with random variations
    const newPredictions = fields.slice(0, 2).map(field => ({
      field: `${field.name} - ${field.crop}`,
      location: `Plot ${field.id}, ${field.area} acres`,
      currentYield: Math.round((Math.random() * 3 + 4) * 10) / 10,
      predictedYield: Math.round((Math.random() * 3 + 4.5) * 10) / 10,
      confidence: Math.round(Math.random() * 20 + 80),
      harvest: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      factors: [
        "Optimal soil conditions",
        "Favorable weather patterns", 
        "Proper nutrient levels",
        "Good pest management"
      ].slice(0, Math.floor(Math.random() * 3) + 2)
    }));
    
    setPredictions(newPredictions);
    setIsLoading(false);
  }, [fields]);

  const completeRecommendation = useCallback((id: number) => {
    setRecommendations(prev => prev.map(rec =>
      rec.id === id ? { ...rec, completed: true } : rec
    ));
  }, []);

  const sendSMSAlert = useCallback((recommendationId: number) => {
    // Simulate SMS sending
    console.log(`SMS alert sent for recommendation ${recommendationId}`);
  }, []);

  return {
    // State
    activeSection,
    isLoading,
    fields,
    predictions,
    recommendations,
    
    // Actions
    setActiveSection,
    addField,
    updateField,
    deleteField,
    runPrediction,
    completeRecommendation,
    sendSMSAlert
  };
};