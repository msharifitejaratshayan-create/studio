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
  highlightedRows: z.array(z.boolean()).describe('An array of booleans indicating whether each row should be highlighted.'),
});
export type HighlightAnomalousRowsOutput = z.infer<typeof HighlightAnomalousRowsOutputSchema>;

export async function highlightAnomalousRows(input: HighlightAnomalousRowsInput): Promise<HighlightAnomalousRowsOutput> {
  return highlightAnomalousRowsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'highlightAnomalousRowsPrompt',
  input: {schema: HighlightAnomalousRowsInputSchema},
  output: {schema: HighlightAnomalousRowsOutputSchema},
  prompt: `You are an AI assistant that helps determine whether rows in a dataset should be highlighted as anomalous.

You will receive an array of data rows and a flag indicating whether highlighting is enabled. The rows may or may not have a column called \"IsAnomalous\".

Your task is to analyze each row and determine, based on the \"IsAnomalous\" field (if present), whether it should be highlighted. If the \"IsAnomalous\" field is not present, default to no highlighting. Respect the isHighlightingEnabled flag.

Return an array of booleans, where each boolean corresponds to a row in the input data. If highlighting is enabled and a row's \"IsAnomalous\" field is true, the corresponding boolean should be true. Otherwise, it should be false.

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
