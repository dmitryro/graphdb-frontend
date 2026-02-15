// ============================================================================
// rule-metadata.config.ts
// Centralized metadata configuration for all rule types
// ============================================================================

/**
 * Type definitions for rule metadata
 */
export interface RuleMetadataOptions {
  // Common metadata
  severities: string[];
  scopes: string[];
  triggers: string[];
  availableModels: string[];

  // Model Rule specific
  logicTypes: string[];
  availableFields: string[];

  // Code Rule specific
  codeRuleOperands: CodeRuleOperand[];
  codeRuleOperators: readonly string[]; // Changed to readonly to support as const
  codeRuleVariables: string[];
  codeRuleAppliesTo: string[];
  codeRuleRunTiming: string[];
  availableAttributes: string[];

  // Mapping Rule specific
  mappingRuleAppliesTo: string[];
  mappingRuleLogicTypes: string[];
  mappingRuleRunTiming: string[];

  // Shared
  codeSystemsAvailable: string[];
}

/**
 * Code Rule operand type
 */
export type CodeRuleOperand =
  | 'Unmapped code count'
  | 'Coverage %'
  | 'Has multiple target codes'
  | 'Has conflicting code system'
  | 'Attribute is empty'
  | 'Crosswalk missing';

/**
 * Operator types for different operand categories
 */
export const OPERATOR_SETS = {
  NUMERIC: ['=', '≠', '>', '≥', '<', '≤'],
  BOOLEAN: ['=', '≠'],
  PRESENCE: ['missing', 'present'],
  STRING: ['=', '≠', 'contains'],
  ALL: ['=', '≠', '>', '≥', '<', '≤', 'contains', 'missing', 'present'],
} as const;

/**
 * Operand to operator mapping
 * Defines which operators are valid for each operand type
 */
export const OPERAND_OPERATOR_MAP: Record<CodeRuleOperand, readonly string[]> = {
  'Unmapped code count': OPERATOR_SETS.NUMERIC,
  'Coverage %': OPERATOR_SETS.NUMERIC,
  'Has multiple target codes': OPERATOR_SETS.BOOLEAN,
  'Has conflicting code system': OPERATOR_SETS.BOOLEAN,
  'Attribute is empty': OPERATOR_SETS.PRESENCE,
  'Crosswalk missing': OPERATOR_SETS.BOOLEAN,
};

/**
 * Default rule metadata configuration
 * This should be the single source of truth for all rule-related dropdowns
 */
export const DEFAULT_RULE_METADATA: RuleMetadataOptions = {
  // ========================================
  // Common Metadata (All Rule Types)
  // ========================================
  severities: ['Low', 'Medium', 'High', 'Critical'],

  scopes: ['Field-level', 'Model-level', 'Source-level', 'System-level'],

  triggers: ['On Ingestion', 'On Update', 'Manual', 'Immediate', 'Aggregate', 'Scheduled'],

  availableModels: [
    'Clinical Observation v2',
    'Patient Demographics v3',
    'Lab Results v1',
    'Vital Signs v2',
    'Insurance Claims v1',
    'Procedure Codes v2',
    'Medication Orders v3',
  ],

  // ========================================
  // Model Rule Specific
  // ========================================
  logicTypes: [
    'Value Mapping',
    'Unit Conversion',
    'Rename / Alias',
    'Derived Value',
    'Default Value',
    'Null / Ignore',
  ],

  availableFields: [
    'patient_id',
    'first_name',
    'last_name',
    'dob',
    'gender',
    'postal_code',
    'insurance_provider',
    'height_in',
    'weight_lb',
    'temperature_f',
    'blood_pressure',
    'heart_rate',
    'diagnosis_code',
    'procedure_code',
    'medication_name',
    'dosage',
    'frequency',
    'prescriber_id',
  ],

  // ========================================
  // Code Rule Specific
  // ========================================
  codeRuleOperands: [
    'Unmapped code count',
    'Coverage %',
    'Has multiple target codes',
    'Has conflicting code system',
    'Attribute is empty',
    'Crosswalk missing',
  ],

  codeRuleOperators: OPERATOR_SETS.ALL,

  codeRuleVariables: [
    '{code_set_name}',
    '{code_set_id}',
    '{code}',
    '{code_value}',
    '{code_system}',
    '{target_code}',
    '{target_code_system}',
    '{mapping_name}',
    '{mapping_version}',
    '{rule_name}',
    '{severity}',
  ],

  codeRuleAppliesTo: ['Entire Code Set', 'Single Code', 'Subset'],

  codeRuleRunTiming: [
    'On import / ingest',
    'On mapping save',
    'On code override save',
    'On publish / promote mapping',
  ],

  availableAttributes: [
    'status',
    'effective_date',
    'expiration_date',
    'provider_specialty',
    'diagnosis_priority',
    'modifier',
    'coding_system_version',
    'billable',
    'age_range',
    'gender_restriction',
  ],

  // ========================================
  // Mapping Rule Specific
  // ========================================
  mappingRuleAppliesTo: ['All mappings in scope', 'Single mapping', 'Subset of mappings'],

  mappingRuleLogicTypes: [
    'Coverage Check',
    'Mapping Conflict',
    'Required Mapping',
    'Model Constraint',
    'Cardinality Violation',
    'Cross-reference Integrity',
  ],

  mappingRuleRunTiming: [
    'On mapping save',
    'On override save',
    'On publish / promote mapping',
    'On ingest',
  ],

  // ========================================
  // Shared Resources
  // ========================================
  codeSystemsAvailable: [
    'ICD-10',
    'ICD-9',
    'CPT',
    'HCPCS',
    'SNOMED CT',
    'LOINC',
    'RxNorm',
    'NDC',
    'CVX',
    'CDT',
  ],
};

/**
 * Helper function to get operators for a specific operand
 * @param operand - The selected left operand
 * @returns Array of valid operators for that operand
 */
export function getOperatorsForOperand(operand: CodeRuleOperand | string): readonly string[] {
  return OPERAND_OPERATOR_MAP[operand as CodeRuleOperand] || OPERATOR_SETS.ALL;
}

/**
 * Helper function to check if an operator requires a right operand
 * @param operator - The selected operator
 * @returns True if right operand is required
 */
export function operatorNeedsRightOperand(operator: string): boolean {
  return !['missing', 'present'].includes(operator);
}

/**
 * Helper function to check if an operand requires attribute selection
 * @param operand - The selected left operand
 * @returns True if attribute selector should be shown
 */
export function operandNeedsAttribute(operand: string): boolean {
  return operand === 'Attribute is empty';
}

/**
 * Severity descriptions for different rule types
 */
export const SEVERITY_DESCRIPTIONS: Record<string, Record<string, string>> = {
  CODE_SET_RULE: {
    Error: 'Breaks canonical integrity if incorrect',
    Warn: 'Significant downstream impact',
    Info: 'Informational or minor adjustment',
  },
  MODEL_RULE: {
    Critical: 'Breaks canonical integrity if incorrect',
    High: 'Significant downstream impact',
    Medium: 'Moderate normalization impact',
    Low: 'Informational or minor adjustment',
  },
  MAPPING_RULE: {
    Critical: 'Breaks mapping integrity if incorrect',
    High: 'Significant mapping impact',
    Medium: 'Moderate mapping issue',
    Low: 'Informational or minor adjustment',
  },
} as const;

/**
 * Rule category type guard
 */
export function isValidRuleCategory(category: string): category is 'code' | 'model' | 'mapping' {
  const normalized = category.toLowerCase().trim();
  return (
    normalized.includes('code') || normalized.includes('model') || normalized.includes('mapping')
  );
}

/**
 * Get rule category from rule data
 * @param rule - The rule object
 * @returns The normalized rule category
 */
export function getRuleCategory(rule: any): 'code' | 'model' | 'mapping' {
  const category = (rule.category || '').toLowerCase().trim();

  if (category.includes('mapping')) {
    return 'mapping';
  } else if (category.includes('code')) {
    return 'code';
  } else {
    return 'model'; // Default
  }
}

/**
 * Get severity options for a specific rule category
 * @param category - The rule category
 * @returns Array of severity options
 */
export function getSeveritiesForCategory(category: 'code' | 'model' | 'mapping'): string[] {
  switch (category) {
    case 'code':
      return ['Error', 'Warn', 'Info'];
    case 'model':
    case 'mapping':
    default:
      return DEFAULT_RULE_METADATA.severities;
  }
}

/**
 * Get severity description for a specific severity level and category
 * @param severity - The severity level
 * @param category - The rule category
 * @returns The description string
 */
export function getSeverityDescription(
  severity: string,
  category: 'code' | 'model' | 'mapping',
): string {
  const categoryKey =
    category === 'code' ? 'CODE_SET_RULE' : category === 'model' ? 'MODEL_RULE' : 'MAPPING_RULE';

  return SEVERITY_DESCRIPTIONS[categoryKey]?.[severity] || '';
}
