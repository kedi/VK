const baseCmd = require("../structures/baseCmd.js")
const shortcuts = require("../structures/shortcuts")
const Discord = require("discord.js")

class rollerCmd extends baseCmd {
    constructor() {
        super({
            name: `Vampir Köylü Rol Dağıtma Komutu`,
            usage: `roller [<ÜyeSayısı><RolAdı>...]`,
            info: `Vampir Köylü lobisinde bulunan oyunculara belirtilen rolleri rastgele dağıtır.`,
            aliases: []
        })
    }
    async execute(client, message, args) {
        let PermissionStatus = await shortcuts.ValidateUser(message, client, "MODERATOR")
        if(PermissionStatus == 201) return;

        let GameInfo = await shortcuts.GetCurrentGame(message, client)
        if(GameInfo == 404) return message.channel.send(`Vampir Köylü için başlatılmış bir oyun bulunamadı. \`${client.settings.MANAGEMENT.Prefix}başlat\` komutu ile bir oyun başlatınız. `)

        if(GameInfo.Host !== message.author.id)  return message.channel.send(`Rol dağıtımını bir tek oyunu başlatan kullanıcı yapabilir. `)
        if(GameInfo.IGNState !== "awaiting-players")  return message.channel.send(`Rol dağıtımı en fazla bir defa yapılabilir.`)

        let regex = /[1-9]{1,2}[A-ZİŞĞÜÖÇÎÔÛÂÊa-zışğüöçâêîôû]+/

        let FalseRegex = args.filter(arg => regex.test(arg) == false)

        if(FalseRegex.length > 0){
            return message.channel.send(`Rol dağıtımı uygun formatta kullanılmadı. Formata uymayan argümanlar:\n\n${FalseRegex.map(el => `• ${el}`).join("\n")}\n\nÖrnek Kullanım: **${client.settings.MANAGEMENT.Prefix}roller 5Büyücü 6Vampir 3Köylü**`)
        }

        let TotalRoleCount = args.length > 0 ? (args.map(x => parseInt(x)).reduce((a,b) => a+b)) : 0
        let VoiceChannel = await client.channels.cache.get(GameInfo.VoiceID)

        if(!VoiceChannel || VoiceChannel.type !== "voice"){
            return message.channel.send(`Bu metin kanalı için ayarlanmış olan ${GameInfo.VoiceID} ID'li bir ses kanalı bulamıyorum. Komut iptal edildi.`)
        }

        await message.guild.members.fetch()

        let VoiceMembers = VoiceChannel.members.filter(a => a.user.id !== GameInfo.Host && !a.user.bot)

        if((VoiceMembers.size) != TotalRoleCount ){
            return message.channel.send(`Komut kullanımında toplamda **${TotalRoleCount}** adet rol belirttiniz fakat <#${VoiceChannel.id}> kanalında **${VoiceMembers.size}** oyuncu bulunmakta. Ses kanalındaki oyuncu sayısına eşit sayıda rol belirtin ve tekrardan deneyin.`)
        }

        let RoleArray = []
        let RoleMap = new Map([])

        args.map(arg => {
            let roleCount = parseInt(arg)
            if(roleCount > 0 && roleCount < 100){
                for(let i = 0; i < roleCount; i++){
                    RoleArray.push(`${arg.slice(`${roleCount}`.length)}`)
                }
            }
        })

        VoiceMembers = VoiceMembers.map(u => u.user.id)

        GameInfo.LiveMembers = VoiceMembers
        GameInfo.IGNState = "roles-given"

        RoleArray = RoleArray
        .map(el => ({
            num: Math.random(),
            element: el
        }))
        .sort((a,b) => b.num - a.num)
        
        RoleArray.map(role => {
            RoleMap.set(VoiceMembers[RoleArray.indexOf(role)], role.element)
        })


        .map(el => ({
            num: Math.random(),
            element: el
        }))
        .sort((a,b) => b.num - a.num).map(x => x.el)

        GameInfo.Roles = RoleMap

        await GameInfo.save()
        await shortcuts.updateGame(client, GameInfo)

        let embed = new Discord.MessageEmbed()
        .setColor("YELLOW")
        .setAuthor(message.author.tag, message.author.avatarURL())
        .setDescription(`\`#${GameInfo.GameID}\` ID'li oyun için ${TotalRoleCount} adet rol üyelere dağıtılmakta. Dağıtılan Roller:\n\n${args.map(arg => `• ${parseInt(arg)} adet **${arg.slice(`${parseInt(arg)}`.length)}**`).join("\n")}\n\n:warning: **Kullanıcılara ve size rollerini DM yoluyla ileteceğim, DM'i sunucuya kapalı olan kullanıcılar rol bilgisini alamayacaktır.**`)
        await message.channel.send(embed)
        
        let AllUserRoles = [...GameInfo.Roles].map(([user, role]) => ({ user, role }))

        await message.author.send(`\`#${GameInfo.GameID}\` ID'li oyunun kullanıcı rolleri:\n${AllUserRoles.map(role => `<@${role.user}> (\`${message.guild.members.cache.get(role.user).displayName}\`): ${role.role}`).join("\n")}`)
        
        return Promise.all(AllUserRoles.map(async(role) => {
            await message.guild.members.cache.get(role.user).send(`\`#${GameInfo.GameID}\` ID'li oyun için rolünüz: **${role.role}**`).catch(e => e)
        }))

    }
}

module.exports = rollerCmd;

