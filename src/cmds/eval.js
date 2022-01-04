
const baseCmd = require("../structures/baseCmd.js")
const discord = require("discord.js")
const { inspect } = require('util');
class evalCmd extends baseCmd {
    constructor() {
        super({
            name: `eval`,
            aliases: ["evalute"]
        })
    }
    async execute(client, message, args, server) {
        if (!client.settings.MANAGEMENT.BotOwners.includes(message.author.id)) return;
        function clean(text, token) {
            if (typeof text === 'string') {
                text = text.replace(/`/g, `\`${String.fromCharCode(8203)}`).replace(/@/g, `@${String.fromCharCode(8203)}`);
                return text.replace(new RegExp(token, 'gi'), '****');
            }
            return text;
        }
        let evaled;
        try {
            const hrStart = process.hrtime();
            evaled = eval(args.join(' ')); // eslint-disable-line no-eval

            if (evaled instanceof Promise) evaled = await evaled;
            const hrStop = process.hrtime(hrStart);

            let response = '';

            response += `\`\`\`js\n${clean(inspect(evaled, { depth: 0 }), message.client.token)}\n\`\`\``;

            if (response.length > 0) {
                await message.channel.send(response);
            }
        } catch (err) {
            console.error('Eval error:', err);
            return message.channel.send(`Error:\`\`\`xl\n${clean(err, message.client.token)}\n\`\`\``);
        }
    }
}

module.exports = evalCmd;
