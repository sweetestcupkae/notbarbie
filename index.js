const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.listen(process.env.PORT || 3000);

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

// TRACK USERS PROCESSED
const handled = new Set();

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// 🔥 RUN ONLY WHEN USER JOINS
client.on("guildMemberAdd", async (member) => {

  const userId = member.id;

  if (handled.has(userId)) return;
  handled.add(userId);

  setTimeout(() => handled.delete(userId), 10 * 60 * 1000);

  const accessChannel = await member.guild.channels.fetch(ACCESS_CHANNEL_ID).catch(() => null);
  const reportChannel = await member.guild.channels.fetch(REPORT_CHANNEL_ID).catch(() => null);

  if (accessChannel) {
    await accessChannel.send(
      `<@${userId}> welcome. Go to <#${REPORT_CHANNEL_ID}>`
    );
  }

  if (reportChannel) {
    await reportChannel.send(
      `<@${userId}> create a ticket within 10 minutes or you will be removed.`
    );
  }

  setTimeout(async () => {
    try {
      const updatedMember = await member.guild.members.fetch(userId);

      if (!updatedMember.roles.cache.has(ROLE_ID)) {
        await updatedMember.kick("No ticket created");
      }

    } catch (err) {
      console.log(err);
    }
  }, 10 * 60 * 1000);
});

client
