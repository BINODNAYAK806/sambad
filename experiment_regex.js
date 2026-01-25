
function resolveTemplateVariables(template, variables, recipientName, recipientNumber) {
    if (!template) return '';
    let result = template;

    console.log('--- Resolving ---');
    console.log('Template:', template);
    console.log('Variables:', variables);
    console.log('Name:', recipientName);

    // Replace standard variables (Always replace, even if empty)
    result = result.replace(/\{\{\s*name\s*\}\}/gi, recipientName || '');
    result = result.replace(/\{\{\s*phone\s*\}\}/gi, recipientNumber || '');

    // Replace custom variables v1-v10
    // Default to empty object if variables is undefined, so we clear the tags
    const safeVars = variables || {};
    for (let i = 1; i <= 10; i++) {
        const key = `v${i}`;
        const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
        const value = safeVars[key] || '';
        result = result.replace(placeholder, value);
    }

    return result;
}

// Test Cases
const t1 = "Hi {{name}}, your code is {{v1}}.";
const v1 = { v1: "123456" };
console.log('Result 1:', resolveTemplateVariables(t1, v1, "John Doe"));

const t2 = "Hello {{ name }} {{v2}}";
const v2 = { v2: "Testing" };
console.log('Result 2:', resolveTemplateVariables(t2, v2, "Jane"));

const t3 = "Double {{v1}} {{v1}}";
console.log('Result 3:', resolveTemplateVariables(t3, v1, "Skip"));

// Test failure case reported?
// "hi {{name}} {{v1}}" -> "hi {{name}} {{v1}}"
console.log('Result Fail:', resolveTemplateVariables("hi {{name}} {{v1}}", {}, ""));
// expectation: if name is empty, it remains {{name}}? Yes, current logic skips if !recipientName.

// Test SUCCESS case (User Request)
const t4 = "Hello {{name}}, your code is {{v1}} and status is {{v2}}";
const v4 = { v1: "9999", v2: "ACTIVE" };
console.log('Result Success:', resolveTemplateVariables(t4, v4, "Alice"));
