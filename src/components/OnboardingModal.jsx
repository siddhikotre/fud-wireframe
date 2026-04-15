import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ArrowRight, Bot, Check, Sparkles, Zap } from 'lucide-react';
import { onboardingQuestions } from '../data/mockData';
import { useUser } from '../context/UserContext';

export default function OnboardingModal() {
  const navigate = useNavigate();
  const {
    user,
    isOnboardingOpen,
    closeOnboarding,
    onboardingIntent,
    updateProfile,
    registerForEvent,
  } = useUser();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOnboardingOpen) {
      setStep(0);
      setAnswers(user.profile || {});
      setDone(false);
      setFinishing(false);
    }
  }, [isOnboardingOpen, user.profile]);

  // Body scroll lock + Esc
  useEffect(() => {
    if (!isOnboardingOpen) return;
    function onEsc(e) { if (e.key === 'Escape') closeOnboarding(); }
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [isOnboardingOpen, closeOnboarding]);

  if (!isOnboardingOpen) return null;

  const currentQ = onboardingQuestions[step];
  const isLastStep = step === onboardingQuestions.length - 1;
  const hasAnswer = !!answers[currentQ?.field];
  const progress = ((step + 1) / onboardingQuestions.length) * 100;

  function select(value) {
    setAnswers({ ...answers, [currentQ.field]: value });
  }

  async function next() {
    if (!hasAnswer) return;
    if (isLastStep) {
      setFinishing(true);
      updateProfile(answers);
      await new Promise(r => setTimeout(r, 700));
      setDone(true);
    } else {
      setStep(step + 1);
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function finish() {
    // If the user entered onboarding from an "Apply" attempt, follow through
    if (onboardingIntent?.type === 'apply' && onboardingIntent.event) {
      registerForEvent(onboardingIntent.event);
    }
    closeOnboarding();
  }

  return (
    <div className="onboarding-backdrop" onClick={closeOnboarding}>
      <div className="onboarding-modal" onClick={e => e.stopPropagation()}>
        {!done && (
          <button className="onboarding-close" onClick={closeOnboarding} aria-label="Close">
            <X size={18} />
          </button>
        )}

        {!done ? (
          <>
            {/* Agent header */}
            <div className="ob-agent-header">
              <div className="ob-agent-avatar">
                <Bot size={20} strokeWidth={2.2} />
                <span className="agent-pulse" />
              </div>
              <div className="ob-agent-meta">
                <span className="ob-agent-name">Fud Agent</span>
                <span className="ob-agent-status">Setting up 1-click apply</span>
              </div>
            </div>

            {/* Progress */}
            <div className="ob-progress-track">
              <div className="ob-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="ob-progress-label">
              Step {step + 1} of {onboardingQuestions.length}
            </div>

            {/* Question */}
            <div className="ob-question" key={step}>
              <h2 className="ob-q-text">{currentQ.question}</h2>
              {currentQ.hint && <p className="ob-q-hint">{currentQ.hint}</p>}

              <div className="ob-options">
                {currentQ.options.map(opt => {
                  const selected = answers[currentQ.field] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      className={`ob-option ${selected ? 'selected' : ''}`}
                      onClick={() => select(opt.value)}
                    >
                      <div className="ob-option-text">
                        <span className="ob-option-label">{opt.label}</span>
                        {opt.desc && <span className="ob-option-desc">{opt.desc}</span>}
                      </div>
                      <div className="ob-option-check">
                        {selected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nav */}
            <div className="ob-nav">
              {step > 0 ? (
                <button className="ob-nav-btn back" onClick={back}>
                  <ArrowLeft size={16} /> Back
                </button>
              ) : <div />}
              <button
                className="ob-nav-btn next"
                onClick={next}
                disabled={!hasAnswer || finishing}
              >
                {finishing ? (
                  <><span className="spinner" /> Saving...</>
                ) : isLastStep ? (
                  <>Finish setup <Check size={16} strokeWidth={3} /></>
                ) : (
                  <>Continue <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="ob-done">
            <div className="ob-done-burst">
              <div className="ob-done-check">
                <Sparkles size={36} strokeWidth={2.4} />
              </div>
            </div>
            <h2 className="ob-done-title">You're all set!</h2>
            <p className="ob-done-sub">
              I'll remember this so future workshops take just one click to apply.
            </p>

            {onboardingIntent?.type === 'apply' && onboardingIntent.event && (
              <div className="ob-apply-ready">
                <Zap size={15} strokeWidth={2.5} />
                Applying you to {onboardingIntent.event.title.slice(0, 38)}{onboardingIntent.event.title.length > 38 ? '…' : ''}
              </div>
            )}

            <button className="ob-done-btn" onClick={finish}>
              {onboardingIntent?.type === 'apply' ? 'Apply now' : 'Take me back'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
