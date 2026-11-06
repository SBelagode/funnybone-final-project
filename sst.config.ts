// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    const { stage } = input

    if (!['production', 'staging'].includes(stage)) {
      throw new Error(`Invalid stage: ${stage}`)
    }

    return {
      name: 'funnybone',
      removal: 'remove',
      protect: false,
      home: 'aws',
      providers: {
        aws: {
          region: 'us-east-1',
          profile: stage, // use stage name as AWS profile name (staging → [profile staging])
        },
      },
      logging: {
        retention: '3 days',
      },
    }
  },

  async run() {
    // set domain based on the stage
    const domain =
      $app.stage === 'production'
        ? {
            name: 'www.crackd.ai',
            redirects: ['crackd.ai'],
          }
        : {
            name: 'www.almostcrackd.ai',
            redirects: ['almostcrackd.ai'],
          }

    const supabaseUrl = new sst.Secret('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseAnonKey = new sst.Secret('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const googleClientID = new sst.Secret('NEXT_PUBLIC_GOOGLE_CLIENT_ID')
    const resendAPIKey = new sst.Secret('RESEND_API_KEY')

    new sst.aws.Nextjs('Funnybone', {
      path: '.',
      domain,
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl.value,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey.value,
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: googleClientID.value,
        NEXT_PUBLIC_API_BASE_URL:
          $app.stage === 'production' ? 'https://api.crackd.ai' : 'https://api.almostcrackd.ai',
        NEXT_PUBLIC_BASE_URL:
          $app.stage === 'production' ? 'https://www.crackd.ai' : 'https://www.almostcrackd.ai',
        NEXT_PUBLIC_ENVIRONMENT: $app.stage,
        RESEND_API_KEY: resendAPIKey.value,
      },
    })
  },
})
