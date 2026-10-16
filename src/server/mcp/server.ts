import {
  getAiVisibilityTrackerTool,
  generateAiVisibilityPromptsTool,
  researchAiVisibilityPromptsTool,
  completeAiResearchSetupTool,
  saveAiVisibilityTrackerTool,
  estimateAiVisibilityCostTool,
  setAiVisibilityScheduleTool,
  runAiVisibilityCheckTool,
  getAiVisibilityRunTool,
  getAiVisibilityResultsTool,
  getAiVisibilityAnswerTool,
  getAiVisibilitySourcesTool,
  getAiVisibilityTrendTool,
  exportAiVisibilityDataTool,
} from "@/server/mcp/tools/ai-visibility-tools";
import {
  type CallToolResult,
  McpServer,
  type ToolAnnotations,
} from "@modelcontextprotocol/server";
import type { z } from "zod";
import { DOMAIN, HOSTED_APP_DOMAIN, SUPPORT_EMAIL, PRICING_URL } from "@/shared/branding";
