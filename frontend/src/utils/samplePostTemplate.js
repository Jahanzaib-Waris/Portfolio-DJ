import { createBlockId } from './blogBlocks.js'

export function getSampleCaseStudyBlocks() {
  return [
    {
      id: createBlockId(),
      type: 'heading',
      level: 'h2',
      kicker: 'CASE STUDY & APP STORE GUIDELINES',
      text: 'Overcoming App Store Review Rejections for Admin-Moderated Apps',
      align: 'left',
      gradient: 'neon',
      layoutWidth: 'fill',
    },
    {
      id: createBlockId(),
      type: 'container',
      direction: 'row',
      wrap: true,
      justify: 'start',
      align: 'start',
      gap: 'md',
      padding: 'none',
      background: 'none',
      border: 'none',
      radius: 'none',
      children: [
        {
          id: createBlockId(),
          type: 'image',
          src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
          alt: 'App Store Review moderation workflow',
          caption: 'Moderation intervention during iOS review',
          fit: 'cover',
          width: '38%',
          layoutWidth: '40%',
          height: '260px',
          aspectRatio: '16/9',
          radius: 'md',
        },
        {
          id: createBlockId(),
          type: 'text',
          layoutWidth: 'fill',
          html: '<p>When launching community-driven mobile applications with User-Generated Content (UGC), adhering to <strong>App Store Guideline 1.2 (Safety)</strong> is non-negotiable. To ensure harmful or abusive content never reaches other members, our architecture routes all newly created posts through a mandatory <code>pending_review</code> status. Posts remain hidden until a human moderator approves them via our internal web admin panel.</p><p>While this architecture is optimal for production compliance, it created an unexpected breakdown during the Apple App Review process: the reviewer created a test post inside the iOS build, did not see it appear on the feed immediately, and flagged the app under <strong>Guideline 2.1 - App Completeness</strong>.</p>',
        },
      ],
    },
    {
      id: createBlockId(),
      type: 'callout',
      style: 'warning',
      title: 'Guideline 2.1 - Performance: App Completeness (Apple Rejection)',
      text: 'We were unable to complete the review of your app because one or more features did not function as intended. Specifically, when we created a new post in your app, the post did not appear in the community feed or user profile. Please review the details below and provide additional information or a fix.',
      layoutWidth: 'fill',
    },
    {
      id: createBlockId(),
      type: 'heading',
      level: 'h3',
      kicker: 'THE AUDIT',
      text: 'Why Standard App Review Submissions Fail for Moderated Platforms',
      align: 'left',
      gradient: 'none',
      layoutWidth: 'fill',
    },
    {
      id: createBlockId(),
      type: 'table',
      title: 'Submission Strategies & Review Outcomes',
      hasHeader: true,
      striped: true,
      compact: false,
      columns: [
        { id: 'c1', label: 'Review Requirement', align: 'left', width: '35%' },
        { id: 'c2', label: 'Attempt 1: Mobile Credentials Only', align: 'center', width: '32%' },
        { id: 'c3', label: 'Attempt 2: Admin Notes & Workflow Script', align: 'center', width: '33%', isHighlight: true },
      ],
      rows: [
        {
          id: 'r1',
          cells: [
            { text: 'Test Accounts Provided', type: 'text' },
            { text: 'Mobile User Only', type: 'check', status: 'no' },
            { text: 'Mobile + Admin Web Moderator', type: 'check', status: 'yes' },
          ],
        },
        {
          id: 'r2',
          cells: [
            { text: 'Moderation Queue Explained', type: 'text' },
            { text: 'No Review Notes', type: 'check', status: 'no' },
            { text: 'Step-by-Step Approval Script', type: 'check', status: 'yes' },
          ],
        },
        {
          id: 'r3',
          cells: [
            { text: 'Video Demonstration Link', type: 'text' },
            { text: 'Omitted', type: 'check', status: 'no' },
            { text: '45-second screen recording URL', type: 'check', status: 'yes' },
          ],
        },
        {
          id: 'r4',
          cells: [
            { text: 'App Store Connect Outcome', type: 'text' },
            { text: 'Rejected (Guideline 2.1)', type: 'text', badge: 'Rejected' },
            { text: 'Approved & Live on App Store', type: 'text', badge: 'Approved' },
          ],
        },
      ],
      layoutWidth: 'fill',
    },
    {
      id: createBlockId(),
      type: 'heading',
      level: 'h3',
      kicker: 'STEP-BY-STEP CHECKLIST',
      text: '5 Verification Requirements Submitted to Apple Review Notes',
      align: 'left',
      gradient: 'none',
      layoutWidth: 'fill',
    },
    {
      id: createBlockId(),
      type: 'list',
      listType: 'unordered',
      style: 'check',
      spacing: 'normal',
      items: [
        { id: 'l1', text: 'Dedicated Staging Admin Portal URL accessible globally with 2FA bypass for Apple IPs.' },
        { id: 'l2', text: 'Pre-configured Admin Moderator login credentials with post-approval privileges.' },
        { id: 'l3', text: 'Step-by-step walkthrough explaining the post queue transition from Pending to Approved.' },
        { id: 'l4', text: 'A concise unlisted video link showing a post being created on iOS and approved in the admin portal.' },
        { id: 'l5', text: 'Direct engineering contact info in case reviewers run into sandbox edge cases.' },
      ],
      layoutWidth: 'fill',
    },
    {
      id: createBlockId(),
      type: 'code',
      language: 'bash',
      filename: 'app_store_connect_review_notes.txt',
      code: `------------------------------------------------------------
APP REVIEW INFORMATION & MODERATION TEST CREDENTIALS
------------------------------------------------------------
Hello Apple App Review Team,

Our app enforces Guideline 1.2 (UGC Safety) through an Admin Moderation Queue.
Newly submitted posts do NOT appear in the public feed until approved by an admin.

To verify the complete post creation lifecycle, please follow these steps:

1. MOBILE APP TEST ACCOUNT:
   - Email: reviewer_ios@yourapp.com
   - Password: [SecureTestPassword123!]

2. CREATE A TEST POST:
   - Tap (+) Create Post -> Enter text -> Tap "Submit".
   - Notice the post displays with badge: "Awaiting Moderation".

3. ADMIN MODERATION WEB PORTAL:
   - URL: https://admin-staging.yourapp.com/moderation/queue
   - Admin Email: apple_review_admin@yourapp.com
   - Password: [SecureAdminPassword456!]

4. APPROVE THE POST:
   - Locate the test post in the "Pending" tab -> Click "Approve".
   - Switch back to the mobile app -> Pull down to refresh -> The post is now live.

Video Walkthrough URL: https://youtu.be/your-demo-unlisted-id
Thank you for your review!
------------------------------------------------------------`,
      layoutWidth: 'fill',
    },
    {
      id: createBlockId(),
      type: 'quote',
      quote: "Apple reviewers have only 5 to 10 minutes per app. If your architecture relies on backend human intervention, you cannot expect them to guess how it works—you must hand them the keys to the moderation room.",
      author: 'Jahanzaib Waris',
      role: 'Full-Stack & Mobile Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      layoutWidth: 'fill',
    },
    {
      id: createBlockId(),
      type: 'button',
      text: 'Explore More Mobile Engineering Case Studies',
      url: '/#projects',
      variant: 'primary',
      size: 'lg',
      target: '_self',
      fullWidth: false,
      layoutWidth: 'hug',
    },
  ]
}

export const SAMPLE_POST_METADATA = {
  title: 'Overcoming App Store Review Rejections for Admin-Moderated Apps',
  slug: 'app-store-connect-review-admin-panel-moderation',
  excerpt: 'How we solved Apple App Store Guideline 2.1 rejection for apps with admin post-moderation queues by providing reviewer staging credentials and review notes.',
}
