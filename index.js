const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server running");
});

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const ROLE_ID = "1493417031503056996";
const ACCESS_CHANNEL_ID = "1493388203565125762";
const REPORT_CHANNEL_ID = "1493391391219519488";

const pendingUsers = new Map();

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const hadRole = oldMember.roles.cache.has(ROLE_ID);
    const hasRole = newMember.roles.cache.has(ROLE_ID);

    if (!hadRole && hasRole) {
      const userId = newMember.id;

      const accessChannel = await newMember.guild.channels.fetch(ACCESS_CHANNEL_ID);
      if (accessChannel) {
        const msg = await accessChannel.send(
          `<@${userId}> got access. Go to <#${REPORT_CHANNEL_ID}>`
        );
        setTimeout(() => msg.delete().catch(() => {}), 60000);
      }

      const reportChannel = await newMember.guild.channels.fetch(REPORT_CHANNEL_ID);
      if (reportChannel) {
        const warning = await reportChannel.send(
          `<@${userId}> create a ticket within 10 minutes or you will be removed.`
        );

        pendingUsers.set(userId, true);

        setTimeout(async () => {
          if (pendingUsers.has(userId)) {
            try {
              const member = await newMember.guild.members.fetch(userId);
              await member.kick("No ticket created");
              pendingUsers.delete(userId);
            } catch (err) {
              console.log(err);
            }
          }
        }, 10 * 60 * 1000);
      }
    }
  } catch (err) {
    console.log(err);
  }
});

client.login(process.env.TOKEN);
