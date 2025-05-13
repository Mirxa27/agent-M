// Define the structure of a workflow template
export interface WorkflowTemplate {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  toolType: string;
  toolConfig: any; // This will be specific to the tool type
  input: any; // This will be specific to the tool type
}

// Example workflow templates
export const workflowTemplates: WorkflowTemplate[] = [
  {
    name: "Summarize Text with OpenAI",
    description: "Summarizes a given text using OpenAI.",
    steps: [
      {
        toolType: "openai",
        toolConfig: {
          model: "gpt-3.5-turbo", // Or any other suitable model
        },
        input: {
          prompt: "Please summarize the following text: {{text}}",
        },
      },
    ],
  },
  {
    name: "Translate Text with OpenAI",
    description: "Translates a given text using OpenAI.",
    steps: [
      {
        toolType: "openai",
        toolConfig: {
          model: "gpt-3.5-turbo",
        },
        input: {
          prompt: "Please translate the following text from {{sourceLanguage}} to {{targetLanguage}}: {{text}}",
        },
      },
    ],
  },
  // More templates can be added here...
];
