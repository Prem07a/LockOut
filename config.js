const CONFIG = {
  functionTemplate: {
    customization_level: "generic",
    rspec_content: "# Write RSpec for unlock_pages function here",
    function: {
      app_name: "iprod",
      name: "unlock_pages",
      description: "Override the Lock",
      content: "# DO NOT CHANGE THE CODE CONTENT\n\nif args[:page]\n  pg = Page.where(:page_key => args[\"page_key\"]).first\n  pg.locked_by = current_user.user_key\n  pg.save\nelse\n  report = Report.where(:report_key => args[\"report_key\"]).first\n  report.locked_by = current_user.user_key\n  report.save\nend\n",
      use_for_edge: false,
      translations: {
        en_US: {
          _function_errors_: {
            "0001": "Unable to unlock: {{name}}"
          }
        },
        hi_IN: {
          _function_errors_: {
            "0001": "अनलॉक करने में असमर्थ: {{name}}"
          }
        },
        ru_RU: {
          _function_errors_: {
            "0001": "Невозможно разблокировать: {{name}}"
          }
        }
      },
      type: "string",
      enabled: true
    }
  },
  
  allowedDomains: [
    /^https:\/\/[a-zA-Z0-9-]+\.datonis\.io/,
    /^https:\/\/[a-zA-Z0-9-]+\.ccbcc\.com/,
    /^http:\/\/localhost(:\d+)?/,
    /^http:\/\/127\.0\.0\.1(:\d+)?/
  ],
  
  urlPattern: /\/v3\/(pages|functions)\/([a-zA-Z0-9_-]+)\/edit/,
  
  apiPaths: {
    createFunction: "/api/v1/functions",
    executeFunction: "/api/v1/functions/unlock_pages/execute"
  }
};