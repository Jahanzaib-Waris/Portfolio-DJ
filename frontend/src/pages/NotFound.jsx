import { Link } from 'react-router-dom'
import useDocumentMeta from '../hooks/useDocumentMeta'
import SystemButton from '../components/SystemButton'

export default function NotFound() {
  useDocumentMeta('Page not found \u2014 Jerry Dev Studio', "The page you were looking for doesn\u2019t exist.")

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      {/* Big gradient 404 number */}
      <p
        className="select-none text-[10rem] font-extrabold leading-none tracking-[-0.04em] sm:text-[14rem]"
        aria-hidden="true"
        style={{
          backgroundImage: 'linear-gradient(135deg, #7C6CFF 0%, #38BDF8 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          opacity: 0.25,
        }}
      >
        404
      </p>

      {/* Content — overlaid on the number */}
      <div className="-mt-12 relative z-10 space-y-4">
        <p className="fb-kicker">Page not found</p>
        <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#ECEEFB] sm:text-3xl">
          Nothing here but void.
        </h1>
        <p className="fb-lead mx-auto max-w-sm">
          This page doesn&rsquo;t exist, or may have moved. Head back and find what you need.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <SystemButton as={Link} to="/" variant="primary" size="lg">
            Back to home
          </SystemButton>
          <SystemButton as={Link} to="/blogs" variant="outline" size="lg">
            Browse the blog &rarr;
          </SystemButton>
        </div>
      </div>
    </div>
  )
}
