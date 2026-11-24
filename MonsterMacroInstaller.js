/*
 * Monster Macro Installer v1.7
 * Roll20 Mod API | D&D 5e by Roll20 (2014) NPC sheet
 * Commands: !setupnpc, !setupnpc --all, !setupnpc --token, !setupnpc --macros, !setupnpc --help
 * Install in Roll20: Game Settings > Mod (API) Scripts > New Script.
 */
var MonsterMacroInstaller = MonsterMacroInstaller || (function () {
    'use strict';
    var PREFIX = 'MMI:', MARK = 'MonsterMacroInstaller:', VERSION = '1.7';
    var esc = function (s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
    var whisper = function (who, text) { sendChat('Monster Macro Installer', '/w "' + String(who || 'gm').replace(/"/g,'') + '" ' + text, null, {noarchive:true}); };
    var attr = function (cid, name) {
        var a = findObjs({_type:'attribute', _characterid:cid, name:name})[0];
        return a ? a.get('current') : '';
    };
    var getRows = function (cid, section) {
        var attrs = findObjs({_type:'attribute', _characterid:cid});
        var re = new RegExp('^repeating_' + section + '_(-[^_]+)_(.+)$');
        var rows = {}, order = [], m;
        attrs.forEach(function(a) {
            m = a.get('name').match(re);
            if (!m) return;
            if (!rows[m[1]]) { rows[m[1]] = {id:m[1]}; order.push(m[1]); }
            rows[m[1]][m[2]] = a.get('current');
        });
        var ordering = String(attr(cid, '_reporder_repeating_' + section) || '').split(',');
        order.sort(function(a,b) {
            var ai = ordering.indexOf(a), bi = ordering.indexOf(b);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai-bi;
        });
        return order.map(function(id){return rows[id];});
    };
    var core = '/w GM &{template:default} {{name=Core Stats}} {{Strength=[[@{strength}]] | [[@{strength_mod}]]}} {{Dexterity=[[@{dexterity}]] | [[@{dexterity_mod}]]}} {{Constitution=[[@{constitution}]] | [[@{constitution_mod}]]}} {{Intelligence=[[@{intelligence}]] | [[@{intelligence_mod}]]}} {{Wisdom=[[@{wisdom}]] | [[@{wisdom_mod}]]}} {{Charisma=[[@{charisma}]] | [[@{charisma_mod}]]}}';
    var secondary = '/w GM &{template:default} {{name= Secondary Stats}} {{Type=@{selected|npc_type} }} {{AC=@{selected|npc_ac} @{selected|npc_actype} }} {{Challenge=@{selected|npc_challenge} }} {{Senses=@{selected|npc_senses} }} {{Languages=@{selected|npc_languages} }} {{Vulnerabilities=@{selected|npc_vulnerabilities} }} {{Resistances=@{selected|npc_resistances} }} {{Immunities=@{selected|npc_immunities} }} {{Condition Immunity=@{selected|npc_condition_immunities} }}';
    var saves = '/w GM &{template:default} {{name=Saving Throws}} {{Str Save=[[1d20+@{npc_str_save}]] | [[1d20+@{npc_str_save}]]}} {{Dex Save=[[1d20+@{npc_dex_save}]] | [[1d20+@{npc_dex_save}]]}} {{Con Save=[[1d20+@{npc_con_save}]] | [[1d20+@{npc_con_save}]]}} {{Int Save=[[1d20+@{npc_int_save}]] | [[1d20+@{npc_int_save}]]}} {{Wis Save=[[1d20+@{npc_wis_save}]] | [[1d20+@{npc_wis_save}]]}} {{Cha Save=[[1d20+@{npc_cha_save}]] | [[1d20+@{npc_cha_save}]]}}';
    // Track ownership in the hidden ability description, not the button name.
    var managed = function(a) {
        return String(a.get('description') || '').indexOf(MARK) === 0 ||
            String(a.get('name') || '').indexOf(PREFIX) === 0;
    };
    var make = function(cid, key, label, action, expected) {
        var abilities = findObjs({_type:'ability', _characterid:cid});
        var marker = MARK + key;
        var ability = abilities.filter(function(a) { return a.get('description') === marker; })[0];
        if (!ability) ability = abilities.filter(function(a) {
            return managed(a) && a.get('name').indexOf(PREFIX) === 0 && a.get('action') === action && !expected[a.id];
        })[0];
        label = label.replace(/[:|}()]/g, ' ').replace(/\s+/g, ' ').trim();
        var name = label, n = 2;
        while (abilities.some(function(a) { return (!ability || a.id !== ability.id) && a.get('name') === name; })) {
            name = label + ' ' + n++;
        }
        var fields = {name:name, action:action, description:marker, istokenaction:true};
        if (ability) ability.set(fields);
        else { fields.characterid = cid; ability = createObj('ability', fields); }
        if (!ability) throw new Error('Could not create ability: ' + name);
        expected[ability.id] = true;
    };
    var hasDamage = function(r) {
        // Roll20 2014 NPC action rows typically expose attack_damage / attack_damage2.
        // Avoid a second roll for descriptive actions without damage data.
        var keys = ['attack_damage','attack_damage2','npc_dmgbase','npc_dmgbase2'];
        return keys.some(function(k) {
            var v = String(r[k] == null ? '' : r[k]).trim();
            return v !== '' && v !== '0';
        });
    };
    var spellMenu = function(cid) {
        var choices = [];
        var sections = ['cantrip','1','2','3','4','5','6','7','8','9'];
        sections.forEach(function(level) {
            getRows(cid,'spell-' + level).forEach(function(r) {
                var name = String(r.spellname || r.spell_name || '').trim();
                if (!name) return;
                // Query options need HTML entities for nested Roll20 syntax.
                // The row ID is stable even when sheet rows are reordered.
                var safeName = name.replace(/&/g,'&amp;').replace(/\|/g,'&#124;').replace(/,/g,'&#44;')
                    .replace(/}/g,'&#125;').replace(/\{/g,'&#123;');
                var label = (level === 'cantrip' ? 'Cantrip' : 'Level ' + level) + ': ' + safeName;
                var reference = 'repeating_spell-' + level + '_' + r.id + '_spell';
                choices.push(label + ',!mmi-cast ' + cid + ' ' + level + ' ' + r.id);
            });
        });
        return choices.length ? '?{Select a Spell|' + choices.join('|') + '}' : '';
    };
    var install = function(cid) {
        var expected = {}, add = function(name, action, key) {
            var row = action.match(/repeating_(npc[^_]+)_(-[^_]+)_/);
            make(cid, key || (row ? row[1] + ':' + row[2] : name), name, action, expected);
        };
        add('Initiative', '%{selected|npc_init}');
        add('Core Stats', core);
        add('Secondary Stats', secondary);
        add('Saving Throws', saves);
        var actions = getRows(cid,'npcaction'), traits = getRows(cid,'npctrait');
        actions.forEach(function(r,i) {
            var n = String(r.name || r.npc_action_name || 'Action '+(i+1)).trim();
            var label = n;
            add('ATK ' + label, '/w gm %{selected|repeating_npcaction_' + r.id + '_npc_action}' + (hasDamage(r) ? '\n/w gm %{selected|repeating_npcaction_' + r.id + '_npc_dmg}' : ''));
        });
        traits.forEach(function(r,i) {
            var n = String(r.name || 'Trait '+(i+1)).trim();
            add('TRT ' + n, '/w gm &{template:npcaction} {{name=@{selected|npc_name}}} {{rname=@{selected|repeating_npctrait_' + r.id + '_name}}} {{description=@{selected|repeating_npctrait_' + r.id + '_description}}}');
        });
        // Reactions are descriptive repeating entries, like NPC traits.
        var reactions = getRows(cid, 'npcreaction');
        reactions.forEach(function(r, i) {
            var n = String(r.name || 'Reaction ' + (i + 1)).trim();
            add('REA ' + n,
                '/w gm &{template:npcaction} {{name=@{selected|npc_name}}} ' +
                '{{rname=@{selected|repeating_npcreaction_' + r.id + '_name}}} ' +
                '{{description=@{selected|repeating_npcreaction_' + r.id + '_description}}}');
        });
        // Legendary actions share the NPC action roll buttons and damage fields.
        var legendary = getRows(cid, 'npcaction-l');
        legendary.forEach(function(r, i) {
            var n = String(r.name || 'Legendary Action ' + (i + 1)).trim();
            var base = 'repeating_npcaction-l_' + r.id;
            add('LEG ' + n,
                '/w gm %{selected|' + base + '_npc_action}' +
                (hasDamage(r) ? '\n/w gm %{selected|' + base + '_npc_dmg}' : ''));
        });
        // Bonus actions and mythic actions use the same roll and damage structure
        // as standard NPC actions, but live in different repeating sections.
        var bonus = getRows(cid, 'npcbonusaction');
        bonus.forEach(function(r, i) {
            var n = String(r.name || r.npc_action_name || 'Bonus Action ' + (i + 1)).trim();
            var base = 'repeating_npcbonusaction_' + r.id;
            add('BON ' + n,
                '/w gm %{selected|' + base + '_npc_action}' +
                (hasDamage(r) ? '\n/w gm %{selected|' + base + '_npc_dmg}' : ''));
        });
        var mythic = getRows(cid, 'npcaction-m');
        mythic.forEach(function(r, i) {
            var n = String(r.name || r.npc_action_name || 'Mythic Action ' + (i + 1)).trim();
            var base = 'repeating_npcaction-m_' + r.id;
            add('MYT ' + n,
                '/w gm %{selected|' + base + '_npc_action}' +
                (hasDamage(r) ? '\n/w gm %{selected|' + base + '_npc_dmg}' : ''));
        });
        var spells = spellMenu(cid);
        if (spells) add('Spells', spells);
        // Remove obsolete installer abilities, including separate DMG buttons from v1.0.
        // Only remove abilities belonging to this installer.
        findObjs({_type:'ability', _characterid:cid}).forEach(function(a) {
            var n = a.get('name');
            if (managed(a) && !expected[a.id]) a.remove();
        });
        return {actions:actions.length, traits:traits.length, reactions:reactions.length, legendary:legendary.length, bonus:bonus.length, mythic:mythic.length, spells:!!spells};
    };
    var setupToken = function(token, cid, done) {
        var ac = attr(cid, 'npc_ac');
        if (ac !== '') token.set({bar1_value:String(ac), bar1_max:String(ac)});
        var formula = String(attr(cid,'npc_hpformula') || '').trim();
        if (!formula) {
            var hp = attr(cid,'hp');
            if (hp !== '' && !isNaN(Number(hp))) token.set({bar3_value:String(hp), bar3_max:String(hp)});
            done('HP formula missing; used existing HP attribute if available');
            return;
        }
        // Only allow ordinary dice arithmetic in HP formula; do not execute arbitrary macro text.
        if (!/^[0-9dD+\-*/()\s]+$/.test(formula)) { done('HP formula contains unsupported characters; HP unchanged'); return; }
        sendChat('Monster Macro Installer', '/roll ' + formula, function(ops) {
            var msg = ops && ops[0], total;
            try { total = msg && msg.content && JSON.parse(msg.content).total; } catch (e) { total = null; }
            if (typeof total === 'number' && isFinite(total)) {
                total = Math.max(1,Math.floor(total));
                token.set({bar3_value:String(total),bar3_max:String(total)});
                done('HP ' + total + ', AC ' + (ac || 'unchanged'));
            } else done('HP roll failed; AC set if available');
        }, {noarchive:true});
    };
    var handle = function(msg) {
        if (msg.type !== 'api') return;
        if (/^!mmi-cast(?:\s|$)/i.test(msg.content)) {
            if (!playerIsGM(msg.playerid)) return;
            var parts = msg.content.trim().split(/\s+/);
            if (parts.length !== 4 || !/^(cantrip|[1-9])$/.test(parts[2]) || !/^-[A-Za-z0-9_-]+$/.test(parts[3])) return;
            var caster = getObj('character', parts[1]);
            if (!caster) return;
            var section = 'spell-' + parts[2];
            var matching = getRows(parts[1], section).some(function(row) { return row.id === parts[3] && (row.spellname || row.spell_name); });
            if (!matching) return;
            // Roll20 does not expand %{...} sent from the Mod API as a sheet ability.
            // Emit a native clickable ability command button instead.
            var match = getRows(parts[1], section).filter(function(row) { return row.id === parts[3]; })[0];
            var spellName = String(match.spellname || match.spell_name || 'Cast spell');
            var safeLabel = spellName.replace(/[\[\]\r\n]/g, ' ').replace(/\)/g, '');
            var abilityName = 'repeating_' + section + '_' + parts[3] + '_spell';
            // Character ID makes the button independent of the current token selection.
            var button = '[' + safeLabel + '](~' + parts[1] + '|' + abilityName + ')';
            sendChat('Monster Spell', '/w gm Cast ' + button, null, {noarchive:true});
            return;
        }
        if (!/^!setupnpc(?:\s|$)/i.test(msg.content)) return;
        if (!playerIsGM(msg.playerid)) return;
        var who = (getObj('player',msg.playerid) || {get:function(){return 'gm';}}).get('_displayname');
        var args = msg.content.trim().split(/\s+/).slice(1), tokenOnly = args.indexOf('--token') !== -1;
        if (args.indexOf('--help') !== -1) {
            whisper(who, '<b>Monster Macro Installer ' + VERSION + '</b><br>!setupnpc — selected token<br>!setupnpc --all — all selected tokens<br>!setupnpc --token — token bars only<br>!setupnpc --macros — refresh abilities without changing token bars.');
            return;
        }
        var selected = (msg.selected || []).filter(function(s){return s._type === 'graphic';});
        if (!selected.length) { whisper(who,'Select a monster token first.'); return; }
        if (args.indexOf('--all') === -1) selected = selected.slice(0,1);
        var processed = {}, report = [];
        selected.forEach(function(s) {
            var token = getObj('graphic',s._id);
            if (!token) return;
            var cid = token.get('represents'), character = cid && getObj('character',cid);
            if (!character) { report.push(esc(token.get('name')) + ': no linked character'); return; }
            var name = character.get('name');
            if (!tokenOnly && !processed[cid]) {
                var stats = install(cid);
                report.push(esc(name) + ': ' + stats.actions + ' actions, ' + stats.traits + ' traits, ' + stats.reactions + ' reactions, ' + stats.legendary + ' legendary actions, ' + stats.bonus + ' bonus actions, ' + stats.mythic + ' mythic actions, spells: ' + (stats.spells ? 'yes' : 'no'));
                processed[cid] = true;
            }
            if (args.indexOf('--macros') === -1) setupToken(token,cid,function(result){ whisper(who,esc(name) + ': ' + esc(result)); });
        });
        if (report.length) whisper(who, report.join('<br>'));
    };
    return {register:function(){on('chat:message',handle); log('Monster Macro Installer v'+VERSION+' ready');}};
}());
on('ready',MonsterMacroInstaller.register);
