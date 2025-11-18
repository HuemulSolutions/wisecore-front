'use client'

import { useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Step {
  id: number
  title: string
  description: string
  action: () => void
  icon?: React.ReactNode
  actionButton?: React.ReactNode
}

interface ActionStepperProps {
  steps: Step[]
  onComplete?: () => void
  title?: string
  subtitle?: string
}

export function ActionStepper({
  steps,
  onComplete,
  title = 'Getting Started',
  subtitle = 'Follow these steps to get started',
}: ActionStepperProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const handleStepComplete = () => {
    // Ejecutar la acción del paso
    steps[currentStep].action()

    // Marcar como completado
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep])
    }

    // Avanzar al siguiente paso si existe
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete?.()
    }
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const isStepCompleted = (stepIndex: number) => completedSteps.includes(stepIndex)
  const isStepCurrent = (stepIndex: number) => stepIndex === currentStep
  // const isStepFuture = (stepIndex: number) => stepIndex > currentStep // Commented out as not currently used

  const progressPercentage = ((completedSteps.length) / steps.length) * 100

  return (
    <div className="w-full max-w-3xl mx-auto px-3 py-4">
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
          {title}
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          {subtitle}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 md:mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-900">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-xs font-medium text-gray-600">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4464f7] transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Desktop: Vertical Timeline */}
      <div className="hidden md:block">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-4">
              {/* Timeline Point */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => handleStepClick(index)}
                  className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all hover:cursor-pointer ${
                    isStepCompleted(index)
                      ? 'bg-[#4464f7] border-[#4464f7] text-white'
                      : isStepCurrent(index)
                        ? 'border-[#4464f7] bg-white text-[#4464f7] scale-110 shadow-lg'
                        : 'border-gray-300 bg-gray-100 text-gray-500 hover:border-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {isStepCompleted(index) ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-16 rounded-full transition-all ${
                      isStepCompleted(index) ? 'bg-[#4464f7]' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1 pb-4">
                <Card
                  className={`p-4 transition-all border shadow-sm hover:shadow-md ${
                    isStepCurrent(index)
                      ? 'ring-2 ring-[#4464f7] bg-white border-[#4464f7]/50'
                      : isStepCompleted(index)
                        ? 'bg-white border-[#4464f7]/20'
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {step.icon && (
                          <div className={`mt-0.5 ${
                            isStepCurrent(index) 
                              ? 'text-[#4464f7]' 
                              : isStepCompleted(index)
                                ? 'text-[#4464f7]'
                                : 'text-gray-400'
                          }`}>
                            {step.icon}
                          </div>
                        )}
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            {step.title}
                          </h3>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isStepCurrent(index) && (
                      <div className="mt-3">
                        {/* Buttons in same row when both exist */}
                        {step.actionButton ? (
                          <div className="flex gap-2">
                            {/* Custom action button - prominent */}
                            <div className="flex-1">
                              {step.actionButton}
                            </div>
                            
                            {/* Default next step button - secondary */}
                            <Button
                              onClick={handleStepComplete}
                              variant="outline"
                              size="sm"
                              className="px-4 py-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:cursor-pointer min-w-[80px] text-xs"
                            >
                              {currentStep === steps.length - 1
                                ? 'Complete'
                                : 'Skip'}
                              <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        ) : (
                          /* Default next step button when no custom action */
                          <Button
                            onClick={handleStepComplete}
                            size="sm"
                            className="w-full bg-[#4464f7] hover:bg-[#3451e6] text-white hover:cursor-pointer text-xs"
                          >
                            {currentStep === steps.length - 1
                              ? 'Complete'
                              : 'Next Step'}
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Accordion Style */}
      <div className="md:hidden space-y-3">
        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={`overflow-hidden transition-all hover:cursor-pointer border shadow-sm hover:shadow-md ${
              isStepCurrent(index)
                ? 'ring-2 ring-[#4464f7] bg-white border-[#4464f7]/50'
                : isStepCompleted(index)
                  ? 'bg-white border-[#4464f7]/20'
                  : 'bg-gray-50 border-gray-200'
            }`}
            onClick={() => handleStepClick(index)}
          >
            <div className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all ${
                    isStepCompleted(index)
                      ? 'bg-[#4464f7] border-[#4464f7] text-white'
                      : isStepCurrent(index)
                        ? 'border-[#4464f7] bg-white text-[#4464f7]'
                        : 'border-gray-300 bg-gray-100 text-gray-500'
                  }`}
                >
                  {isStepCompleted(index) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {step.icon && (
                      <div className={`${
                        isStepCurrent(index) 
                          ? 'text-[#4464f7]' 
                          : isStepCompleted(index)
                            ? 'text-[#4464f7]'
                            : 'text-gray-400'
                      }`}>
                        {step.icon}
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 text-xs truncate">
                      {step.title}
                    </h3>
                  </div>
                  {isStepCurrent(index) && (
                    <p className="text-xs text-[#4464f7] font-medium mt-0.5">
                      Current step
                    </p>
                  )}
                </div>

                {isStepCompleted(index) && (
                  <Check className="w-4 h-4 text-[#4464f7] flex-shrink-0" />
                )}
              </div>

              {isStepCurrent(index) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-3">
                    {step.description}
                  </p>
                  
                  <div>
                    {/* Buttons in same row when both exist - Mobile */}
                    {step.actionButton ? (
                      <div className="space-y-2">
                        {/* Custom action button - prominent on mobile */}
                        <div className="w-full">
                          {step.actionButton}
                        </div>
                        
                        {/* Default next step button - secondary on mobile */}
                        <Button
                          onClick={handleStepComplete}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs py-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 hover:cursor-pointer min-h-[32px]"
                        >
                          {currentStep === steps.length - 1
                            ? 'Complete'
                            : 'Skip'}
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    ) : (
                      /* Default next step button when no custom action - Mobile */
                      <Button
                        onClick={handleStepComplete}
                        size="sm"
                        className="w-full text-xs bg-[#4464f7] hover:bg-[#3451e6] text-white hover:cursor-pointer min-h-[32px]"
                      >
                        {currentStep === steps.length - 1
                          ? 'Complete'
                          : 'Next Step'}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
