export default function TermsOfServicePage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center p-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using Crackd, you agree to be bound by these
              Terms of Service. If you do not agree with any part of these
              terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily access Crackd for personal,
              non-commercial use only. This license does not include:
            </p>
            <ul className="list-disc pl-6">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for commercial purposes</li>
              <li>Attempting to decompile or reverse engineer any software</li>
              <li>Removing any copyright or proprietary notations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Content</h2>
            <p>By uploading content to Crackd, you:</p>
            <ul className="list-disc pl-6">
              <li>Retain all ownership rights to your content</li>
              <li>
                Grant us a license to use, display, and distribute your content
              </li>
              <li>Confirm that you have the right to share the content</li>
              <li>Agree not to upload harmful or inappropriate content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Content Moderation Policy
            </h2>
            <p className="text-muted-foreground mb-4">
              Note: This is an initial version of our content moderation policy.
              Future updates may modify the specificity of particular points.
            </p>

            <h3 className="text-xl font-medium mb-2">
              Prohibited Text Content in Images
            </h3>
            <p>
              Images including text with the following language are prohibited:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Hate Speech:</strong> Language that alludes towards or
                encourages violence, discrimination, or hatred against
                individuals or groups based on race, ethnicity, nationality,
                religion, gender, gender identity, sexual orientation, age,
                disability, or other protected characteristics.
              </li>
              <li>
                <strong>Harassment:</strong> Text that simulates targeted
                harassment, threats, or bullying of individuals or groups.
                Language that could cause distress, fear, or intimidation is not
                allowed.
              </li>
              <li>
                <strong>Adult Content:</strong> Sexually explicit or
                pornographic language in image captions or embedded text.
              </li>
              <li>
                <strong>Violence & Self-Harm:</strong> Text that promotes,
                glorifies, or trivializes violence, self-harm, or suicide.
              </li>
              <li>
                <strong>Traumatic Content:</strong> Jokes that rely on the
                traumatic nature of events for humor. Neutral references to
                traumatic events are allowed, but the substance of the joke must
                not rest on the traumatic nature of the event.
              </li>
              <li>
                <strong>Illegal Activities:</strong> Text that promotes illegal
                activities or violates international laws.
              </li>
            </ul>

            <h3 className="text-xl font-medium mb-2">
              Prohibited Image Content
            </h3>
            <p>Images including the following content are prohibited:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Gore & Violence:</strong> Graphic depictions of gore,
                dismemberment, or extreme violence.
              </li>
              <li>
                <strong>Sexual Content:</strong> Nudity, genitalia, or sexually
                explicit imagery.
              </li>
              <li>
                <strong>Self-Harm:</strong> Images depicting self-harm, suicide,
                or graphic depictions of mental health crises.
              </li>
              <li>
                <strong>Traumatic Imagery:</strong> Images that depict traumatic
                events (e.g., road accidents, severe injury or death during
                natural disasters).
              </li>
              <li>
                <strong>Abuse & Cruelty:</strong> Images depicting abuse or
                cruelty toward humans or animals.
              </li>
              <li>
                <strong>Illegal Content:</strong> Images promoting or depicting
                illegal activities.
              </li>
            </ul>

            <h3 className="text-xl font-medium mb-2">General Guidelines</h3>
            <ul className="list-disc pl-6">
              <li>You must be 18 years or older to use this app.</li>
              <li>
                All submitted content must comply with applicable international
                laws and regulations.
              </li>
              <li>
                Our app primarily uses automated moderation. Not all content is
                human-reviewed.
              </li>
              <li>
                There is no reporting mechanism since your submissions are not
                visible to other users.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Disclaimer</h2>
            <p>
              The materials on Crackd are provided on an &apos;as is&apos; basis.
              We make no warranties, expressed or implied, and hereby disclaim and
              negate all other warranties including, without limitation, implied
              warranties or conditions of merchantability, fitness for a
              particular purpose, or non-infringement of intellectual property
              or other violation of rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Limitations</h2>
            <p>
              In no event shall Crackd or its suppliers be liable for any
              damages (including, without limitation, damages for loss of data
              or profit, or due to business interruption) arising out of the use
              or inability to use the materials on Crackd.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. Revisions and Errata
            </h2>
            <p>
              The materials appearing on Crackd could include technical,
              typographical, or photographic errors. We do not warrant that any
              of the materials are accurate, complete, or current.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <p className="mt-2">Email: {process.env.NEXT_PUBLIC_LEGAL_EMAIL}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
