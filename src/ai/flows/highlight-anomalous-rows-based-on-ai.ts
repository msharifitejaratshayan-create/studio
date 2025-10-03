// highlight-anomalous-rows-based-on-ai.ts
'use server';
/**
 * @fileOverview This file contains a Genkit flow for intelligently highlighting anomalous rows in a dataset based on the `IsAnomalous` column, using AI to determine if highlighting should be applied.
 *
 * - highlightAnomalousRows - A function that processes the input data and determines which rows should be highlighted.
 * - HighlightAnomalousRowsInput - The input type for the highlightAnomalousRows function, which includes the data rows and a flag indicating if highlighting should be enabled.
 * - HighlightAnomalousRowsOutput - The output type for the highlightAnomalousRows function, which includes an array of booleans indicating whether each row should be highlighted.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HighlightAnomalousRowsInputSchema = z.object({
  dataRows: z.array(z.record(z.any())).describe('An array of data rows, where each row is an object.'),
  isHighlightingEnabled: z.boolean().describe('A flag indicating whether highlighting is enabled.'),
});
export type HighlightAnomalousRowsInput = z.infer<typeof HighlightAnomalousRowsInputSchema>;

const HighlightAnomalousRowsOutputSchema = z.object({
  highlightedRows: z.array(z.enum(['red', 'green', 'none'])).describe("An array of strings indicating whether each row should be highlighted and with which color ('red', 'green', or 'none')."),
});
export type HighlightAnomalousRowsOutput = z.infer<typeof HighlightAnomalousRowsOutputSchema>;

export async function highlightAnomalousRows(input: HighlightAnomalousRowsInput): Promise<HighlightAnomalousRowsOutput> {
  return highlightAnomalousRowsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'highlightAnomalousRowsPrompt',
  input: {schema: HighlightAnomalousRowsInputSchema},
  output: {schema: HighlightAnomalousRowsOutputSchema},
  prompt: `You are an AI assistant that helps determine whether rows in a dataset should be highlighted based on their 'AnomalyScore'.

You will receive an array of data rows and a flag indicating whether highlighting is enabled.

Your task is to analyze each row's 'AnomalyScore'.
- If highlighting is enabled:
  - If 'AnomalyScore' > 0.5, the row should be highlighted 'red'.
  - If 'AnomalyScore' <= 0.5, the row should be highlighted 'green'.
- If a row does not have an 'AnomalyScore' or if highlighting is disabled, it should be 'none'.

Return an array of strings ('red', 'green', or 'none'), where each string corresponds to a row in the input data.

Here's the input data:

Is Highlighting Enabled: {{{isHighlightingEnabled}}}
Data Rows: {{#each dataRows}}{{{@index}}}: {{this}}\n{{/each}}
`,
});

const highlightAnomalousRowsFlow = ai.defineFlow(
  {
    name: 'highlightAnomalousRowsFlow',
    inputSchema: HighlightAnomalousRowsInputSchema,
    outputSchema: HighlightAnomalousRowsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
