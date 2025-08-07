import re

# Read the file
with open('unit.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match callback invocations
pattern = r'self\.on_property_change_callbacks\[\"(\w+)\"\]\(self, self\.(\w+)\)'
replacement = r'self._trigger_callback("\1", self.\2)'

# Replace all matches
new_content = re.sub(pattern, replacement, content)

# Write back to file
with open('unit.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated all callback invocations')
