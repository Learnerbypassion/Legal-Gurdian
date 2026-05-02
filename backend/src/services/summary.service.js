/**
 * Assembles the final structured response from AI output + risk data
 * @param {object} aiResult - parsed AI JSON
 * @param {object} riskData - { score, level, detectedKeywords }
 * @param {object} meta - { filename, charCount, language, userType }
 * @returns {object} formatted response
 */
const formatAnalysis = (aiResult, riskData, meta = {}) => {
  // Convert summary object to array of strings
  const summaryArray = [];
  if (aiResult.summary && typeof aiResult.summary === 'object') {
    if (aiResult.summary.what) summaryArray.push(aiResult.summary.what);
    if (aiResult.summary.who) summaryArray.push(aiResult.summary.who);
    if (aiResult.summary.core_obligation) summaryArray.push(aiResult.summary.core_obligation);
    if (aiResult.summary.biggest_risk) summaryArray.push(aiResult.summary.biggest_risk);
    if (aiResult.summary.if_breach) summaryArray.push(aiResult.summary.if_breach);
  }

  return {
    success: true,
    meta: {
      filename: meta.filename || "contract.pdf",
      charCount: meta.charCount || 0,
      language: meta.language || "English",
      userType: meta.userType || "general",
      analyzedAt: new Date().toISOString(),
    },
    contractType: aiResult.contractType || "Unknown",
    parties: aiResult.parties || [],
    keyDates: aiResult.keyDates || [],
    summary: summaryArray.length > 0 ? summaryArray : [],
    pros: aiResult.pros || [],
    cons: aiResult.cons || [],
    highlightedClauses: aiResult.highlightedClauses || [],
    overallAdvice: aiResult.overallAdvice || "",
    riskScore: {
      score: riskData.score,
      label: riskData.level.label,
      color: riskData.level.color,
      description: riskData.level.description,
      detectedKeywords: riskData.detectedKeywords,
    },
  };
};

module.exports = { formatAnalysis };
