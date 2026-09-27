import { useState, useRef } from 'react'
import { submitQuoteRequest } from '../api/client'

const initialForm = {
  full_name: '',
  email: '',
  service: '',
  backend: '',
  budget: '',
  timeline: '',
  project_link: '',
  details: '',
  company_website: '',
}

export default function EnquiryForm({ onSuccess, isModal = false }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [globalError, setGlobalError] = useState(null)
  const successRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.full_name.trim()) {
      newErrors.full_name = 'Please tell me your name.'
    }
    if (!form.email.trim()) {
      newErrors.email = 'I need an email address to reply to you.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'I need a valid email address to reply to you.'
    }
    if (!form.service) {
      newErrors.service = 'Please pick the option closest to what you need.'
    }
    if (!form.details.trim()) {
      newErrors.details = 'A short description helps me understand what you need.'
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Bot detection via honeypot
    if (form.company_website) {
      setStatus('success')
      return
    }

    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setStatus('submitting')
    setGlobalError(null)

    try {
      await submitQuoteRequest({
        name: form.full_name.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        service: form.service,
        backend: form.backend,
        budget: form.budget,
        timeline: form.timeline,
        project_link: form.project_link.trim(),
        project_details: form.details.trim(),
        details: form.details.trim(),
        company_website: form.company_website,
      })

      setStatus('success')
      setForm(initialForm)
      if (onSuccess) onSuccess()
      setTimeout(() => {
        if (successRef.current) {
          successRef.current.focus()
        }
      }, 50)
    } catch (err) {
      setStatus('idle')
      if (err.response?.data) {
        const serverErrors = err.response.data
        const mapped = {}
        if (serverErrors.name || serverErrors.full_name) {
          mapped.full_name = Array.isArray(serverErrors.name || serverErrors.full_name)
            ? (serverErrors.name || serverErrors.full_name)[0]
            : 'Please tell me your name.'
        }
        if (serverErrors.email) {
          mapped.email = Array.isArray(serverErrors.email)
            ? serverErrors.email[0]
            : 'I need an email address to reply to you.'
        }
        if (serverErrors.project_details || serverErrors.details) {
          mapped.details = Array.isArray(serverErrors.project_details || serverErrors.details)
            ? (serverErrors.project_details || serverErrors.details)[0]
            : 'A short description helps me understand what you need.'
        }
        setErrors(mapped)
        setGlobalError(serverErrors.detail || 'Something went wrong. Please check the fields above and try again.')
      } else {
        setGlobalError('Something went wrong. Please try again.')
      }
    }
  }

  if (status === 'success') {
    return (
      <div
        ref={successRef}
        tabIndex="-1"
        className="fb-success outline-none"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl text-status-green">&#10003;</span>
          <div>
            <h3 className="system-heading text-lg font-bold text-white">Thank you!</h3>
            <p className="mt-1 text-sm text-[#ECEEFB] leading-relaxed">
              Thanks, your project details are in. I will reply by email with questions or next steps.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form className="fb-form" onSubmit={handleSubmit} noValidate>
      {/* 1. Name */}
      <div className={`fb-field ${errors.full_name ? 'fb-field--invalid' : ''}`}>
        <label htmlFor={isModal ? 'modal_full_name' : 'full_name'}>
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id={isModal ? 'modal_full_name' : 'full_name'}
          name="full_name"
          type="text"
          placeholder="Your name"
          required
          autoComplete="name"
          value={form.full_name}
          onChange={handleChange}
        />
        {errors.full_name && <p className="fb-error">{errors.full_name}</p>}
      </div>

      {/* 2. Email */}
      <div className={`fb-field ${errors.email ? 'fb-field--invalid' : ''}`}>
        <label htmlFor={isModal ? 'modal_email' : 'email'}>
          Email <span aria-hidden="true">*</span>
        </label>
        <input
          id={isModal ? 'modal_email' : 'email'}
          name="email"
          type="email"
          placeholder="you@company.com"
          required
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
        />
        {errors.email && <p className="fb-error">{errors.email}</p>}
      </div>

      {/* 3. Service Pill Radios */}
      <fieldset className={`fb-field fb-field--pills ${errors.service ? 'fb-field--invalid' : ''}`}>
        <legend>
          What do you need? <span aria-hidden="true">*</span>
        </legend>
        <div className="fb-pills-wrap pt-1">
          {[
            'Build a new app',
            'Fix an existing app',
            'Integrate into an existing app',
            'Custom code',
          ].map((srv) => (
            <label key={srv}>
              <input
                type="radio"
                name="service"
                value={srv}
                checked={form.service === srv}
                onChange={handleChange}
              />
              <span>{srv}</span>
            </label>
          ))}
        </div>
        {errors.service && <p className="fb-error">{errors.service}</p>}
      </fieldset>

      {/* 4. Backend (Dropdown) */}
      <div className="fb-field">
        <label htmlFor={isModal ? 'modal_backend' : 'backend'}>Backend</label>
        <select
          id={isModal ? 'modal_backend' : 'backend'}
          name="backend"
          value={form.backend}
          onChange={handleChange}
        >
          <option value="">- Select your backend -</option>
          <option value="Firebase">Firebase</option>
          <option value="Supabase">Supabase</option>
          <option value="Custom API / other">Custom API / other</option>
          <option value="Not sure yet">Not sure yet</option>
        </select>
      </div>

      {/* 5. Budget (Dropdown) */}
      <div className="fb-field">
        <label htmlFor={isModal ? 'modal_budget' : 'budget'}>Budget</label>
        <select
          id={isModal ? 'modal_budget' : 'budget'}
          name="budget"
          value={form.budget}
          onChange={handleChange}
        >
          <option value="">- Select a budget range -</option>
          <option value="Under $500">Under $500</option>
          <option value="$500 – $2,000">$500 &ndash; $2,000</option>
          <option value="$2,000 – $5,000">$2,000 &ndash; $5,000</option>
          <option value="$5,000+">$5,000+</option>
          <option value="Not sure yet">Not sure yet</option>
        </select>
      </div>

      {/* 6. Timeline (Dropdown) */}
      <div className="fb-field">
        <label htmlFor={isModal ? 'modal_timeline' : 'timeline'}>Timeline</label>
        <select
          id={isModal ? 'modal_timeline' : 'timeline'}
          name="timeline"
          value={form.timeline}
          onChange={handleChange}
        >
          <option value="">- When do you need it? -</option>
          <option value="As soon as possible">As soon as possible</option>
          <option value="Within a month">Within a month</option>
          <option value="1–3 months">1&ndash;3 months</option>
          <option value="Flexible">Flexible</option>
        </select>
      </div>

      {/* 7. Project Link */}
      <div className="fb-field">
        <label htmlFor={isModal ? 'modal_project_link' : 'project_link'}>
          Project or recording link
        </label>
        <input
          id={isModal ? 'modal_project_link' : 'project_link'}
          name="project_link"
          type="url"
          placeholder="https://"
          aria-describedby={isModal ? 'modal-link-help' : 'link-help'}
          value={form.project_link}
          onChange={handleChange}
        />
        <p className="fb-help" id={isModal ? 'modal-link-help' : 'link-help'}>
          Optional: a screen recording, TestFlight or Play Store link, or a design file.
        </p>
      </div>

      {/* 8. Details */}
      <div className={`fb-field ${errors.details ? 'fb-field--invalid' : ''}`}>
        <label htmlFor={isModal ? 'modal_details' : 'details'}>
          Project details <span aria-hidden="true">*</span>
        </label>
        <textarea
          id={isModal ? 'modal_details' : 'details'}
          name="details"
          rows={5}
          required
          placeholder="What are you building, what is broken, or what should the app connect to? Include any error messages."
          value={form.details}
          onChange={handleChange}
        />
        {errors.details && <p className="fb-error">{errors.details}</p>}
      </div>

      {/* Honeypot: hidden from people, tempting to bots */}
      <input
        type="text"
        name="company_website"
        tabIndex="-1"
        autoComplete="off"
        className="fb-hp"
        aria-hidden="true"
        value={form.company_website}
        onChange={handleChange}
      />

      {globalError && <p className="fb-error mb-4">{globalError}</p>}

      <button
        className="system-button system-button-primary w-full py-3.5 text-base font-bold text-center cursor-pointer transition-all"
        type="submit"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Sending...' : 'Send project details'}
      </button>
    </form>
  )
}
