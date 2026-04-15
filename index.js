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

console.log("notbarbie starting...");

// ================= CONFIG =================
const ROLE_ID = "1493417031503056996";
const ACCESS_CHANNEL_ID = "1493388203565125762";
const REPORT_CHANNEL_ID = "1493391391219519488";

// ================= STATE =================
// prevents duplicate triggers per session
const activeUsers = new Set();

// stores kick timers so we can safely track them
const pending = new Map();

// ================= READY =================
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ================= MAIN LOGIC =================
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const hadRole = oldMember.roles.cache.has(ROLE_ID);
    const hasRole = newMember.roles.cache.has(ROLE_ID);

    // ONLY RUN WHEN ROLE IS FIRST ADDED
    if (!hadRole && hasRole) {

      const userId = newMember.id;

      // HARD GUARD AGAINST DUPLICATES
      if (activeUsers.has(userId)) return;
      activeUsers.add(userId);

      // auto cleanup after 5 min
      setTimeout(() => activeUsers.delete(userId), 5 * 60 * 1000);

      const guild = newMember.guild;

      // ================= ACCESS MESSAGE =================
      const accessChannel = await guild.channels.fetch(ACCESS_CHANNEL_ID).catch(() => null);

      if (accessChannel) {
        await accessChannel.send(
          `<@${userId}> you have been granted access. Please proceed to <#${REPORT_CHANNEL_ID}>.`
        );
      }

      // ================= REPORT WARNING =================
      const reportChannel = await guild.channels.fetch(REPORT_CHANNEL_ID).catch(() => null);

      if (reportChannel) {
        await reportChannel.send(
          `⚠️ <@${userId}> please submit a ticket within **10 minutes** or you will be removed.`
        );
      }

      // ================= KICK TIMER =================
      if (pending.has(userId)) return;

      pending.set(userId, true);

      setTimeout(async () => {
        try {
          const member = await guild.members.fetch(userId);

          await member.kick("Did not submit ticket in time");

          pending.delete(userId);

          const logChannel = await guild.channels.fetch(REPORT_CHANNEL_ID).catch(() => null);
          if (logChannel) {
            logChannel.send(`❌ <@${userId}> was removed for not submitting a ticket in time.`);
          }

        } catch (err) {
          console.log("Kick error:", err);
        }
      }, 10 * 60 * 1000);
    }

  } catch (err) {
    console.log("Error:", err);
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
