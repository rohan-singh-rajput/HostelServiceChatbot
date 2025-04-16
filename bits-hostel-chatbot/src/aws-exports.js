  const awsConfig = {
    aws_project_region: import.meta.env.VITE_AWS_PROJECT_REGION,
    aws_cognito_region: import.meta.env.VITE_AWS_COGNITO_REGION,
    aws_user_pools_id: import.meta.env.VITE_AWS_USER_POOLS_ID,
    aws_user_pools_web_client_id: import.meta.env.VITE_AWS_USER_POOLS_WEB_CLIENT_ID,
    oauth: {
      domain: import.meta.env.VITE_AWS_OAUTH_DOMAIN,
      scope: ["openid", "profile", "email"],
      redirectSignIn: import.meta.env.VITE_AWS_REDIRECT_SIGNIN,
      redirectSignOut: import.meta.env.VITE_AWS_REDIRECT_SIGNOUT,
      responseType: import.meta.env.VITE_AWS_RESPONSE_TYPE
    }
  };

  export default awsConfig;

  