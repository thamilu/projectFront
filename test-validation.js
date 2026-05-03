const { z } = require('zod');
const { zodResolver } = require('@hookform/resolvers/zod');

async function test() {
  const schema = z.object({
    pan: z.string().toUpperCase()
  });
  const resolver = zodResolver(schema);
  const result = await resolver({}, undefined, { fields: { pan: { name: 'pan' } } });
  console.log('Result:', result);
}
test();
