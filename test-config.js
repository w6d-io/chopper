const configString = 'infractions:http://localhost:8000:local,oathkeeper:https://oathkeeperapiurl.com:oathkeeper:your_bearer_token_here';

function parseApiConfigs(configString) {
  if (!configString) return [];

  return configString
    .split(',')
    .map((config) => {
      const trimmedConfig = config.trim();
      
      // Find first colon for name
      const firstColonIndex = trimmedConfig.indexOf(':');
      if (firstColonIndex === -1) {
        console.warn(
          `Invalid API config format: ${config}. Expected at least name:url`,
        );
        return null;
      }

      const name = trimmedConfig.substring(0, firstColonIndex).trim();
      const remainder = trimmedConfig.substring(firstColonIndex + 1);
      
      // For URL part, we need to be smarter about parsing
      // URLs can contain colons (http://localhost:8000)
      // So we look for the pattern that suggests end of URL
      let baseUrl;
      let label;
      let authToken;
      
      // Try to find if there are additional components after the URL
      // Look for patterns like :label or :label:token at the end
      const urlPattern = /^(https?:\/\/[^:]+(?::[0-9]+)?(?:\/[^:]*)?)(.*)$/;
      const match = remainder.match(urlPattern);
      
      if (match) {
        baseUrl = match[1].trim();
        const additionalParts = match[2];
        
        if (additionalParts && additionalParts.startsWith(':')) {
          const extraParts = additionalParts.substring(1).split(':');
          label = extraParts[0]?.trim() || undefined;
          authToken = extraParts[1]?.trim() || undefined;
        }
      } else {
        // If it doesn't match URL pattern, treat the whole remainder as URL
        // and assume no additional parts
        const parts = remainder.split(':');
        baseUrl = parts[0].trim();
        label = parts[1]?.trim() || undefined;
        authToken = parts[2]?.trim() || undefined;
      }

      // Clean up baseUrl - remove trailing slashes
      baseUrl = baseUrl.replace(/\/$/, '');

      return {
        name,
        baseUrl,
        status: 'unknown',
        label: label || undefined,
        requiresAuth: authToken ? true : false,
        authToken: authToken || undefined,
      };
    })
    .filter((config) => config !== null);
}

console.log('Testing API config parsing:');
console.log(JSON.stringify(parseApiConfigs(configString), null, 2));
