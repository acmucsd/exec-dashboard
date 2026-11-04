const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL ?? '/api',
    endpoints: {
      member: {
        member: '/members',
        previewCreate: '/members/preview',
      },
    },
  },
  header: {
    workflowConfirmation: 'X-Workflow-Confirmation',
  },
};

export default config;
