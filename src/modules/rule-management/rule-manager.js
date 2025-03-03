/**
 * Rule Manager Module
 * 
 * This module provides functionality for creating, editing, and managing redaction rules.
 * It handles rule validation, storage, and organization.
 */

import { validateRedactionRule } from '../../utils/validation-utils.js';

// Default rule templates
const RULE_TEMPLATES = {
  EMAIL: {
    name: 'Email Address',
    regex: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
    replacementType: 'fixed',
    replacement: '[EMAIL]',
    description: 'Matches standard email addresses',
    category: 'personal'
  },
  
  PHONE_US: {
    name: 'US Phone Number',
    regex: '\\b(\\+?1[-\\s]?)?(\\(?[0-9]{3}\\)?[-\\s]?)?[0-9]{3}[-\\s]?[0-9]{4}\\b',
    replacementType: 'fixed',
    replacement: '[PHONE]',
    description: 'Matches US phone numbers in various formats',
    category: 'personal'
  },
  
  SSN: {
    name: 'Social Security Number',
    regex: '\\b[0-9]{3}[-\\s]?[0-9]{2}[-\\s]?[0-9]{4}\\b',
    replacementType: 'character',
    replacementChar: 'X',
    description: 'Matches US Social Security Numbers',
    category: 'financial'
  },
  
  CREDIT_CARD: {
    name: 'Credit Card Number',
    regex: '\\b(?:[0-9]{4}[-\\s]?){3}[0-9]{4}\\b',
    replacementType: 'format-preserving',
    description: 'Matches credit card numbers with 16 digits',
    category: 'financial'
  },
  
  DATE: {
    name: 'Date',
    regex: '\\b(?:[0-9]{1,2}[-/\\s][0-9]{1,2}[-/\\s][0-9]{2,4}|[A-Za-z]{3,9}\\s[0-9]{1,2},?\\s[0-9]{2,4})\\b',
    replacementType: 'fixed',
    replacement: '[DATE]',
    description: 'Matches dates in various formats',
    category: 'general'
  },
  
  IP_ADDRESS: {
    name: 'IP Address',
    regex: '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b',
    replacementType: 'fixed',
    replacement: '[IP_ADDRESS]',
    description: 'Matches IPv4 addresses',
    category: 'technical'
  },
  
  NAME: {
    name: 'Person Name',
    regex: '\\b[A-Z][a-z]+\\s+[A-Z][a-z]+\\b',
    replacementType: 'fixed',
    replacement: '[NAME]',
    description: 'Matches names in "First Last" format with capitalization',
    category: 'personal'
  },
  
  ADDRESS: {
    name: 'Street Address',
    regex: '\\b\\d+\\s+[A-Za-z0-9\\s,]+\\b(?:Avenue|Lane|Road|Boulevard|Drive|Street|Ave|Dr|Rd|Blvd|Ln|St)\\.?\\b',
    replacementType: 'fixed',
    replacement: '[ADDRESS]',
    description: 'Matches common street address formats',
    category: 'personal'
  },
  
  FILE_PATH: {
    name: 'File Path',
    regex: '\\b(?:[A-Za-z]:\\\\|/(?:home|usr|var|etc|opt|tmp)/)(?:[\\w\\-./\\\\]+)\\b',
    replacementType: 'fixed',
    replacement: '[FILE_PATH]',
    description: 'Matches file system paths (Windows and Unix)',
    category: 'technical'
  },
  
  AGENCY_NAME: {
    name: 'Agency Name',
    regex: '\\b(?:Department of|U\\.S\\.|United States|Federal|National|Office of|Bureau of|Agency for)\\s+[A-Z][\\w\\s]+\\b',
    replacementType: 'fixed',
    replacement: '[AGENCY]',
    description: 'Matches common government agency name patterns',
    category: 'government'
  },
  
  URL: {
    name: 'Website URL',
    regex: '\\b(?:https?://|www\\.)[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    replacementType: 'fixed',
    replacement: '[URL]',
    description: 'Matches website URLs',
    category: 'technical'
  }
};

/**
 * Rule Manager class for handling redaction rules
 */
class RuleManager {
  /**
   * Initialize the rule manager
   */
  constructor() {
    this.rules = [];
    this.templates = RULE_TEMPLATES;
    this.loadRulesFromStorage();
  }
  
  /**
   * Load existing rules from local storage
   */
  loadRulesFromStorage() {
    try {
      const savedRules = localStorage.getItem('redactionRules');
      if (savedRules) {
        this.rules = JSON.parse(savedRules);
      }
    } catch (error) {
      console.error('Failed to load rules from storage:', error);
      this.rules = [];
    }
  }
  
  /**
   * Save current rules to local storage
   */
  saveRulesToStorage() {
    try {
      localStorage.setItem('redactionRules', JSON.stringify(this.rules));
    } catch (error) {
      console.error('Failed to save rules to storage:', error);
    }
  }
  
  /**
   * Get all available rules
   * @returns {Array} - Array of redaction rules
   */
  getAllRules() {
    return [...this.rules];
  }
  
  /**
   * Get rule by ID
   * @param {string} ruleId - ID of the rule to retrieve
   * @returns {Object|null} - The rule object or null if not found
   */
  getRuleById(ruleId) {
    return this.rules.find(rule => rule.id === ruleId) || null;
  }
  
  /**
   * Add a new rule
   * @param {Object} rule - Rule to add
   * @returns {Object} - Result with success flag and message or error
   */
  addRule(rule) {
    // Validate the rule
    const validation = validateRedactionRule(rule);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Check for duplicate name
    if (this.rules.some(r => r.name === rule.name)) {
      return { success: false, error: 'A rule with this name already exists' };
    }
    
    // Generate ID if not provided
    if (!rule.id) {
      rule.id = `rule-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
    
    // Set creation timestamp
    rule.created = new Date().toISOString();
    
    // Add to rules list
    this.rules.push(rule);
    
    // Save changes
    this.saveRulesToStorage();
    
    return { 
      success: true, 
      ruleId: rule.id, 
      message: `Rule "${rule.name}" added successfully` 
    };
  }
  
  /**
   * Update an existing rule
   * @param {string} ruleId - ID of the rule to update
   * @param {Object} updatedRule - Updated rule data
   * @returns {Object} - Result with success flag and message or error
   */
  updateRule(ruleId, updatedRule) {
    // Find the rule
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index === -1) {
      return { success: false, error: 'Rule not found' };
    }
    
    // Validate the updated rule
    const validation = validateRedactionRule(updatedRule);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Check for duplicate name with other rules
    if (updatedRule.name !== this.rules[index].name && 
        this.rules.some(r => r.name === updatedRule.name)) {
      return { success: false, error: 'A rule with this name already exists' };
    }
    
    // Update modified timestamp
    updatedRule.modified = new Date().toISOString();
    
    // Preserve creation date
    updatedRule.created = this.rules[index].created;
    
    // Update the rule
    this.rules[index] = { ...updatedRule, id: ruleId };
    
    // Save changes
    this.saveRulesToStorage();
    
    return { 
      success: true, 
      message: `Rule "${updatedRule.name}" updated successfully` 
    };
  }
  
  /**
   * Delete a rule
   * @param {string} ruleId - ID of the rule to delete
   * @returns {Object} - Result with success flag and message or error
   */
  deleteRule(ruleId) {
    // Find the rule
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index === -1) {
      return { success: false, error: 'Rule not found' };
    }
    
    // Store rule name for message
    const ruleName = this.rules[index].name;
    
    // Remove the rule
    this.rules.splice(index, 1);
    
    // Save changes
    this.saveRulesToStorage();
    
    return { 
      success: true, 
      message: `Rule "${ruleName}" deleted successfully` 
    };
  }
  
  /**
   * Create a rule from a template
   * @param {string} templateName - Name of the template to use
   * @returns {Object} - Result with success flag and rule or error
   */
  createRuleFromTemplate(templateName) {
    // Check if template exists
    if (!this.templates[templateName]) {
      return { success: false, error: 'Template not found' };
    }
    
    // Create a new rule from the template
    const template = this.templates[templateName];
    
    // Determine which matching type to use based on template
    const hasPattern = !!template.pattern;
    const hasRegex = !!template.regex;
    
    const rule = {
      id: `rule-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: template.name,
      pattern: hasPattern ? template.pattern : null,
      regex: hasRegex ? template.regex : null,
      replacementType: template.replacementType || 'fixed',
      replacement: template.replacement || '[REDACTED]',
      replacementChar: template.replacementChar || 'X',
      description: template.description || '',
      priority: 1,
      enabled: true,
      created: new Date().toISOString()
    };
    
    // Add the rule
    const result = this.addRule(rule);
    
    if (result.success) {
      return { success: true, rule };
    } else {
      return result;
    }
  }
  
  /**
   * Get available rule templates
   * @returns {Object} - Object containing available templates
   */
  getTemplates() {
    // Use a deeper clone to ensure no references are shared
    return JSON.parse(JSON.stringify(this.templates));
  }
  
  /**
   * Import rules from JSON
   * @param {string} jsonString - JSON string containing rules to import
   * @returns {Object} - Result with success flag, count, and message or error
   */
  importRules(jsonString) {
    try {
      // Parse JSON
      const importedRules = JSON.parse(jsonString);
      
      if (!Array.isArray(importedRules)) {
        return { success: false, error: 'Invalid format: Expected an array of rules' };
      }
      
      let importCount = 0;
      let skipCount = 0;
      
      // Process each rule
      for (const rule of importedRules) {
        // Validate rule
        const validation = validateRedactionRule(rule);
        if (!validation.valid) {
          skipCount++;
          continue;
        }
        
        // Check for duplicate name
        if (this.rules.some(r => r.name === rule.name)) {
          skipCount++;
          continue;
        }
        
        // Generate new ID to avoid conflicts
        rule.id = `rule-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        // Set creation timestamp
        rule.created = new Date().toISOString();
        
        // Add to rules list
        this.rules.push(rule);
        importCount++;
      }
      
      // Save changes if any rules were imported
      if (importCount > 0) {
        this.saveRulesToStorage();
      }
      
      return { 
        success: true, 
        imported: importCount,
        skipped: skipCount,
        message: `Imported ${importCount} rules successfully${skipCount > 0 ? ` (skipped ${skipCount} invalid or duplicate rules)` : ''}` 
      };
    } catch (error) {
      console.error('Failed to import rules:', error);
      return { success: false, error: `Failed to import rules: ${error.message}` };
    }
  }
  
  /**
   * Export rules to JSON
   * @returns {string} - JSON string containing all rules
   */
  exportRules() {
    return JSON.stringify(this.rules, null, 2);
  }
}

export { RuleManager, RULE_TEMPLATES };