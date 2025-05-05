/**
 * Script to create agent templates
 */
import { db } from "../server/db";
import { eq } from "drizzle-orm";
import { agentTools } from "../shared/schema";
import { 
  ANTHROPIC_CLAUDE_TEMPLATE,
  OPENAI_CHAT_TEMPLATE,
  PERPLEXITY_TEMPLATE,
  XAI_TEMPLATE,
  CODE_GENERATOR_TEMPLATE,
  templateToInsertTool
} from "../shared/agent-tools-templates";

/**
 * Create agent templates in the database
 */
async function createAgentTemplates() {
  console.log("Creating AI agent templates...");

  // The templates we want to create
  const templates = [
    OPENAI_CHAT_TEMPLATE,       // Template for OpenAI
    ANTHROPIC_CLAUDE_TEMPLATE,  // Template for Anthropic Claude
    PERPLEXITY_TEMPLATE,        // Template for Perplexity
    XAI_TEMPLATE,               // Template for xAI
    CODE_GENERATOR_TEMPLATE     // Template for code generation
  ];

  // Use a consistent timestamp for all templates
  const now = new Date();
  
  // Create each template in the database
  for (const template of templates) {
    const insertData = templateToInsertTool(template);
    
    // Add system flag and timestamps
    const toolWithDefaults = {
      ...insertData,
      isSystem: true, // Mark as system template so it can't be deleted
      createdAt: now,
      updatedAt: now,
    };
    
    try {
      // Check if template with same name already exists
      const existingTools = await db
        .select()
        .from(agentTools)
        .where(eq(agentTools.name, template.name));
      
      if (existingTools.length > 0) {
        console.log(`Template "${template.name}" already exists, skipping.`);
        continue;
      }
      
      // Insert the template
      const [newTool] = await db
        .insert(agentTools)
        .values(toolWithDefaults)
        .returning();
        
      console.log(`Created template: "${newTool.name}" (ID: ${newTool.id})`);
    } catch (error) {
      console.error(`Error creating template "${template.name}":`, error);
    }
  }
  
  console.log("Agent templates creation completed.");
}

// Run the function
createAgentTemplates()
  .then(() => {
    console.log("Script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });