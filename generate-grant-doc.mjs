import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TableRow, TableCell, Table,
  WidthType, ShadingType, PageBreak, TabStopPosition, TabStopType,
  ExternalHyperlink
} from "docx";
import * as fs from "fs";

// --- Helpers ---
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 300, after: 120 }, children: [new TextRun({ text, bold: true })] });
}
function h1(text) { return heading(text, HeadingLevel.HEADING_1); }
function h2(text) { return heading(text, HeadingLevel.HEADING_2); }
function h3(text) { return heading(text, HeadingLevel.HEADING_3); }

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...opts.paragraphOpts,
    children: [new TextRun({ text, size: 22, ...opts })]
  });
}
function bold(text, opts = {}) { return p(text, { bold: true, ...opts }); }
function italic(text, opts = {}) { return p(text, { italics: true, ...opts }); }

function richParagraph(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: runs.map(r => {
      if (typeof r === "string") return new TextRun({ text: r, size: 22 });
      return new TextRun({ size: 22, ...r });
    })
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: typeof text === "string"
      ? [new TextRun({ text, size: 22 })]
      : text.map(r => typeof r === "string" ? new TextRun({ text: r, size: 22 }) : new TextRun({ size: 22, ...r }))
  });
}

function numberedItem(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbered-list", level },
    spacing: { after: 60 },
    children: typeof text === "string"
      ? [new TextRun({ text, size: 22 })]
      : text.map(r => typeof r === "string" ? new TextRun({ text: r, size: 22 }) : new TextRun({ size: 22, ...r }))
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}

function hr() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999" } },
    children: []
  });
}

function simpleTable(headers, rows) {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.SOLID, color: "2B3D4F" },
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: "FFFFFF" })] })],
    width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE }
  }));
  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: String(cell), size: 20 })] })],
      width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE }
    }))
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...dataRows]
  });
}

// --- Build Document ---
const doc = new Document({
  numbering: {
    config: [{
      reference: "numbered-list",
      levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START, style: { paragraph: { indent: { left: 360, hanging: 260 } } } }]
    }]
  },
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
      heading1: { run: { font: "Calibri", size: 36, bold: true, color: "1B4F72" } },
      heading2: { run: { font: "Calibri", size: 28, bold: true, color: "2B3D4F" } },
      heading3: { run: { font: "Calibri", size: 24, bold: true, color: "34495E" } }
    }
  },
  sections: [{
    properties: {
      page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } }
    },
    children: [
      // ============ TITLE PAGE ============
      spacer(), spacer(), spacer(), spacer(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "TRES ISLAS ORPHANAGE FUND", size: 52, bold: true, color: "1B4F72" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "Grant Action Kit", size: 36, color: "2B3D4F" })]
      }),
      hr(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "Do these 5 things. I've written everything for you.", size: 24, italics: true, color: "555555" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "Estimated total time: 3-4 hours spread over 2 weeks.", size: 24, italics: true, color: "555555" })]
      }),
      spacer(), spacer(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: "Prepared February 2026", size: 22, color: "777777" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Kerstin Hadzik, Treasurer", size: 22, color: "777777" })]
      }),

      // ============ ACTION SUMMARY PAGE ============
      new Paragraph({ children: [new PageBreak()] }),
      h1("YOUR 5 ACTIONS"),
      p("In priority order. Each one has ready-to-send materials later in this document."),
      spacer(),

      simpleTable(
        ["#", "Action", "Your Time", "Potential $"],
        [
          ["1", "Submit to Global Fund for Children", "30 min", "$5K-$50K"],
          ["2", "Send Montrose Foundation letter", "10 min", "Warm lead"],
          ["3", "Email 3 Rotary Clubs", "20 min", "$1.5K-$15K"],
          ["4", "Apply to GlobalGiving", "45 min", "$5K-$20K/yr"],
          ["5", "Email 3 local churches", "20 min", "$3K-$30K/yr"],
        ]
      ),
      spacer(),
      richParagraph([
        { text: "Conservative first-year estimate: $10,000-$50,000. ", bold: true },
        "That alone could eliminate your annual deficit."
      ]),
      spacer(),

      // --- Action 1 ---
      h2("ACTION 1: Submit to Global Fund for Children (30 min)"),
      richParagraph([
        { text: "Why this one first: ", bold: true },
        "They specifically fund organizations under $200K. You are their ideal grantee. Rolling deadline. $5,000-$50,000 grants."
      ]),
      numberedItem("Go to: globalfundforchildren.org/for-community-based-organizations/"),
      numberedItem("Click the Expression of Interest (EOI) form"),
      numberedItem("Copy/paste from the answers in Section A of this document"),
      numberedItem("Submit"),
      spacer(),

      // --- Action 2 ---
      h2("ACTION 2: Send the Montrose Foundation Letter (10 min)"),
      richParagraph([
        { text: "Why: ", bold: true },
        "You already have a relationship. Warm leads beat cold ones every time."
      ]),
      numberedItem("Find any old emails, contacts, or records you have from the Montrose Foundation"),
      numberedItem("Copy the letter from Section B of this document"),
      numberedItem("Fill in any details you remember (dates, amounts, contact names)"),
      numberedItem("Email or mail it"),
      spacer(),

      // --- Action 3 ---
      h2("ACTION 3: Email 3 Rotary Clubs (20 min)"),
      richParagraph([
        { text: "Why: ", bold: true },
        "Rotary clubs hand out $500-$5,000 checks to people who show up and tell a good story. You have the best story. These are the fastest grants on the planet."
      ]),
      numberedItem("Copy the email from Section C of this document"),
      numberedItem("Send it to these 3 clubs:"),
      bullet([{ text: "Sandy Area Rotary ", bold: true }, "-- Google \"Sandy Utah Rotary Club\" or search directory.rotary.org"], 0),
      bullet([{ text: "Salt Lake City Rotary ", bold: true }, "-- slcrotary.org"], 0),
      bullet([{ text: "Draper Rotary ", bold: true }, "-- Google \"Draper Utah Rotary Club\" or search directory.rotary.org"], 0),
      numberedItem("They'll invite you to present at a lunch meeting. Show up, tell your story, bring the Fact Sheet (Section E)."),
      spacer(),

      // --- Action 4 ---
      h2("ACTION 4: Apply to GlobalGiving (45 min)"),
      richParagraph([
        { text: "Why: ", bold: true },
        "Once you're on GlobalGiving, you get access to corporate matching funds, monthly donor tools, and foundation grants you can't get otherwise. You set it up once and it works forever."
      ]),
      numberedItem("Go to: globalgiving.org/organizations/apply/"),
      numberedItem("Use the answers from Section D of this document"),
      numberedItem("Submit"),
      spacer(),

      // --- Action 5 ---
      h2("ACTION 5: Email 3 Local Churches (20 min)"),
      richParagraph([
        { text: "Why: ", bold: true },
        "Most churches with 200+ members have a $5,000-$25,000 international missions budget they give away every year. Many go underused. Orphans in Mexico is exactly what these funds exist for."
      ]),
      numberedItem("Copy the email from Section F of this document"),
      numberedItem("Send to 3 large churches near Sandy, UT (target non-denominational, Catholic, and mainline Protestant churches)"),
      numberedItem("They'll either write a check or invite you to present to their missions committee"),
      spacer(),
      bold("That's it. Five actions. Everything below is the ready-to-send material."),

      // ============ SECTION A ============
      new Paragraph({ children: [new PageBreak()] }),
      h1("SECTION A: Global Fund for Children -- EOI Answers"),
      italic("Copy/paste these answers into their Expression of Interest form."),
      spacer(),

      bold("Organization Name:"),
      p("Tres Islas Orphanage Fund Incorporated"),
      spacer(),
      bold("Country of Operation:"),
      p("Mexico"),
      spacer(),
      bold("Year Founded:"),
      p("1986 (tax-exempt since 1998)"),
      spacer(),
      bold("Annual Budget:"),
      p("$107,618 (FY2024)"),
      spacer(),
      bold("Number of Staff:"),
      p("0 paid staff. 100% volunteer operated including all board members."),
      spacer(),
      bold("Number of People Served:"),
      p("160+ children across 6 orphanage homes"),
      spacer(),

      bold("Mission Statement:"),
      p("Tres Islas Orphanage Fund provides essential food, hygiene supplies, education support, medical care, and facility improvements to over 160 children living in six orphanage homes in Mazatlan, Mexico, ensuring they have the nourishment, safety, and opportunity they need to thrive."),
      spacer(),

      bold("Describe your organization and its work:"),
      p("For nearly 40 years, Tres Islas Orphanage Fund has been the largest and most consistent supporter of six orphanage homes in Mazatlan, Mexico. Every two weeks, our on-the-ground facilitator purchases fresh food from local markets and delivers it directly to each home. We retain receipts for every purchase and maintain complete financial transparency."),
      p("Beyond food, we provide hygiene supplies, school materials and uniforms, medical and dental care, psychological support for survivors of abuse, and facility repairs. One of our six homes, FloreSer, is a sanctuary for adolescent girls who have survived violence and sexual abuse -- we fund their mental health services."),
      p("Our model is unique: 100% of donations go directly to the children. All board members volunteer without compensation. We have no paid staff and no administrative overhead. This model has operated continuously for nearly 40 years, serving over 6,000 children."),
      spacer(),

      bold("What is the primary issue your organization addresses?"),
      p("Food insecurity and lack of basic services for orphaned and abandoned children in Mazatlan, Mexico. The Mexican government allocates less than 2% of its budget to child protection, leaving orphanages severely underfunded. Several of the homes we serve receive no government support at all and depend entirely on outside organizations like ours. Without our bi-weekly food deliveries, these children would face hunger within days."),
      spacer(),

      bold("Who are the children/youth you serve?"),
      p("We serve 160+ children ranging from newborns to young adults across six homes:"),
      bullet("Abandoned infants and toddlers"),
      bullet("Children removed from homes due to parental abuse or severe poverty"),
      bullet("Adolescent boys at risk of recruitment by criminal organizations (Refugio Mazatlan, 40 boys)"),
      bullet("Teenage girls recovering from violence and sexual abuse (FloreSer, 15 girls)"),
      bullet("Children needing educational, financial, and social services (Salvation Army Home, 24 children)"),
      spacer(),

      bold("How are the children/youth involved in your work?"),
      p("The children are the direct beneficiaries of everything we do. We work closely with the directors of each home to understand the specific needs of the children -- what food they need, what school supplies are required, what facility repairs are urgent. During our annual mission weeks, volunteers interact directly with the children. We also run a child sponsorship program where donors can support a specific home and build a relationship with the children there."),
      spacer(),

      bold("What would you use a grant for?"),
      p("A grant would sustain our bi-weekly food delivery program, which is the lifeline for 160+ children. $50/month feeds one child. $10,000 feeds 16 children for an entire year. Specifically, funds would cover fresh food purchases, hygiene supplies, school materials, and -- if the grant is large enough -- mental health services for the 15 girls at FloreSer who are survivors of violence."),
      spacer(),

      bold("What makes your organization different?"),
      p("Three things: (1) 100% of donated funds go directly to the children -- we have zero paid staff and zero administrative overhead. (2) We have nearly 40 years of unbroken service with receipts for every purchase ever made. (3) A small amount goes extraordinarily far -- $50/month feeds a child, making our cost-per-impact among the lowest of any children's organization."),

      // ============ SECTION B ============
      new Paragraph({ children: [new PageBreak()] }),
      h1("SECTION B: Montrose Foundation Letter"),
      italic("Print on letterhead or send as email. Fill in the [BRACKETS] with whatever you remember."),
      hr(),
      spacer(),

      richParagraph([{ text: "Subject: ", bold: true }, "Reconnecting -- Tres Islas Orphanage Fund"]),
      spacer(),
      p("Dear Friends at the Montrose Foundation,"),
      spacer(),
      p("My name is Kerstin Hadzik and I serve as Treasurer of the Tres Islas Orphanage Fund, a 501(c)(3) nonprofit that has provided food and essential care to orphaned children in Mazatlan, Mexico for nearly 40 years."),
      spacer(),
      p("I'm reaching out to reconnect. The Montrose Foundation generously supported our work in the past, and that support made a real difference in the lives of the children we serve. [IF YOU REMEMBER: \"Your grant of $____ in ____ helped us ______.\"] We have never forgotten that partnership, and I'm writing to explore whether we might work together again."),
      spacer(),
      p("Since we last connected, our work has grown:"),
      bullet("We now support 6 orphanage homes serving over 160 children"),
      bullet("We added FloreSer, a home for teenage girls who are survivors of violence and abuse"),
      bullet("We added Refugio Mazatlan, a home for 40 adolescent boys focused on breaking the poverty cycle"),
      bullet("We have served over 6,000 children total across our history"),
      bullet("We still operate on a 100% volunteer model -- every dollar donated goes directly to the children"),
      spacer(),
      p("I'll be honest with you: like many small nonprofits, we're feeling the pressure of rising costs and flat donor revenue. The children's needs haven't shrunk -- they've grown. Reconnecting with valued partners like the Montrose Foundation is one of the most important things I can do right now."),
      spacer(),
      p("I'd welcome a conversation -- by phone, email, or in person -- about what a renewed partnership might look like. Even a small grant makes an enormous difference when $50 feeds a child for a month."),
      spacer(),
      p("I'm happy to send our most recent 990-EZ, program reports, photos, or anything else that would be helpful. And we always welcome visitors to the homes in Mazatlan."),
      spacer(),
      p("Thank you for the difference you've already made in these children's lives."),
      spacer(),
      p("With gratitude,"),
      spacer(),
      bold("Kerstin Hadzik"),
      p("Treasurer, Tres Islas Orphanage Fund"),
      p("501(c)(3) | EIN: 84-1408725"),
      p("480-799-5118"),
      p("donations@tresislas.org"),
      p("www.tresislas.org"),

      // ============ SECTION C ============
      new Paragraph({ children: [new PageBreak()] }),
      h1("SECTION C: Rotary Club Email"),
      italic("Send to the club secretary or president. Find their email on the club website."),
      hr(),
      spacer(),

      richParagraph([{ text: "Subject: ", bold: true }, "Local nonprofit -- would love 15 minutes at a meeting"]),
      spacer(),
      p("Hi,"),
      spacer(),
      p("My name is Kerstin Hadzik. I'm the Treasurer of the Tres Islas Orphanage Fund, a 501(c)(3) based here in Sandy, Utah. For nearly 40 years, we've been feeding and caring for over 160 orphaned children in Mazatlan, Mexico. Every two weeks we deliver fresh food to six orphanage homes -- including a home for teenage girls who are survivors of violence."),
      spacer(),
      p("We're an all-volunteer organization. Zero paid staff. 100% of every dollar goes directly to the children. $50 feeds a child for a month."),
      spacer(),
      p("I would love the opportunity to share our story at an upcoming club meeting -- just 10-15 minutes. I think your members would find our work compelling, and we'd be grateful for any support the club might consider."),
      spacer(),
      p("Happy to work around your schedule. Thank you for considering this."),
      spacer(),
      bold("Kerstin Hadzik"),
      p("Treasurer, Tres Islas Orphanage Fund"),
      p("480-799-5118 | donations@tresislas.org"),
      p("www.tresislas.org"),

      // ============ SECTION D ============
      new Paragraph({ children: [new PageBreak()] }),
      h1("SECTION D: GlobalGiving Application Answers"),
      italic("Use these when you apply at globalgiving.org/organizations/apply/"),
      spacer(),

      bold("Organization Legal Name:"),
      p("Tres Islas Orphanage Fund Incorporated"),
      spacer(),
      bold("EIN:"),
      p("84-1408725"),
      spacer(),
      bold("Organization Type:"),
      p("501(c)(3)"),
      spacer(),
      bold("Year Established:"),
      p("1986"),
      spacer(),
      bold("Country:"),
      p("United States (operating in Mexico)"),
      spacer(),
      bold("Address:"),
      p("PO BOX 708522, Sandy, UT 84070"),
      spacer(),
      bold("Website:"),
      p("www.tresislas.org"),
      spacer(),
      bold("Annual Operating Budget:"),
      p("$107,618"),
      spacer(),

      bold("About Your Organization:"),
      p("Tres Islas Orphanage Fund has provided food, education, medical care, and essential support to orphaned and abandoned children in Mazatlan, Mexico for nearly 40 years. We are the largest external supporter of six orphanage homes serving 160+ children. Our unique model ensures 100% of donated funds go directly to the children -- all board members and staff volunteer without compensation. We purchase fresh food locally every two weeks and deliver it directly to each home, retaining receipts for every transaction. Over our history, we have served more than 6,000 children."),
      spacer(),

      bold("Project Title:"),
      p("Nourishing Futures: Food Security for 160+ Orphaned Children in Mazatlan"),
      spacer(),

      bold("Project Summary:"),
      p("Our bi-weekly food delivery program is the primary food source for 160+ children across six orphanage homes in Mazatlan, Mexico. Every two weeks, fresh food is purchased from local markets and delivered directly to each home. This program has operated continuously for nearly 40 years. In addition to food, we provide hygiene supplies, school materials, medical care, and mental health services for girls who are survivors of violence. $50 feeds one child for one month. $10,000 feeds 16 children for an entire year."),
      spacer(),

      bold("Project Goals:"),
      numberedItem("Provide uninterrupted bi-weekly food deliveries to all 6 orphanage homes (26 deliveries/year)"),
      numberedItem("Ensure 160+ children receive adequate nutrition year-round"),
      numberedItem("Provide school supplies and uniforms to all school-age children"),
      numberedItem("Fund psychological services for 15 girls at FloreSer who are survivors of violence"),
      spacer(),

      bold("How will you measure success?"),
      bullet("Number of bi-weekly food deliveries completed (target: 26/year, 100% completion)"),
      bullet("Number of children receiving regular meals (target: 160+)"),
      bullet("Detailed financial accounting with retained receipts for every purchase"),
      bullet("Quarterly reports to donors and funders"),
      bullet("Annual in-person verification during mission weeks"),

      // ============ SECTION E ============
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "TRES ISLAS ORPHANAGE FUND", size: 44, bold: true, color: "1B4F72" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "Feeding 160+ children across 6 homes in Mazatlan, Mexico -- for nearly 40 years.", size: 24, italics: true, color: "444444" })]
      }),
      hr(),

      h2("THE PROBLEM"),
      p("Mexico has 1.8 million children in 700+ orphanages. The government funds less than 2% of child protection. Most orphanages are severely underfunded. Without outside help, children go hungry."),
      spacer(),

      h2("OUR SOLUTION"),
      p("Every two weeks, we buy fresh food from local markets in Mazatlan and deliver it directly to six orphanage homes. No middlemen. No cash transfers. We see the food go into the pantry and we keep every receipt."),
      spacer(),

      h2("BY THE NUMBERS"),
      simpleTable(
        ["Metric", "Value"],
        [
          ["Years of operation", "Nearly 40"],
          ["Children served (current)", "160+"],
          ["Children served (lifetime)", "6,000+"],
          ["Orphanage homes supported", "6"],
          ["Paid staff", "0 (100% volunteer)"],
          ["Percent to children", "100%"],
          ["Cost to feed 1 child/month", "$50"],
          ["Cost to feed 1 child/year", "$600"],
        ]
      ),
      spacer(),

      h2("THE 6 HOMES WE SERVE"),
      bullet([{ text: "Salvation Army Children's Home", bold: true }, " -- 24 children needing financial and social services"]),
      bullet([{ text: "Casa del Mar", bold: true }, " -- 22 girls in a safe and loving home"]),
      bullet([{ text: "Hogar San Pablo", bold: true }, " -- 38 boys receiving education and health care"]),
      bullet([{ text: "Ciudad de Los Ninos", bold: true }, " -- 37 abandoned and neglected children"]),
      bullet([{ text: "FloreSer", bold: true }, " -- 15 girls who are survivors of violence and abuse"]),
      bullet([{ text: "Refugio Mazatlan", bold: true }, " -- 40 boys breaking the cycle of poverty"]),
      spacer(),

      h2("WHAT MAKES US DIFFERENT"),
      richParagraph([{ text: "$0 in overhead. ", bold: true }, "Every board member volunteers. No salaries. No office rent. No administrative costs deducted from your gift."]),
      richParagraph([{ text: "40 years of receipts. ", bold: true }, "We have documented accountability for every purchase since the beginning. Donors can visit the homes and see the impact firsthand."]),
      richParagraph([{ text: "Your dollar goes further here. ", bold: true }, "$50/month feeds a child. $5,000 feeds 8 children for a year. $10,000 feeds 16 children for a year."]),
      spacer(),

      h2("HOW TO HELP"),
      bullet([{ text: "Donate: ", bold: true }, "givebutter.com/TresIslas"]),
      bullet([{ text: "Sponsor a child: ", bold: true }, "$50 or $100/month"]),
      bullet([{ text: "Volunteer: ", bold: true }, "Visit Mazatlan or help from home"]),
      bullet([{ text: "Partner: ", bold: true }, "Foundation grants, corporate sponsorships, church mission funds"]),
      spacer(),

      h2("CONTACT"),
      bold("Kerstin Hadzik, Treasurer"),
      p("480-799-5118 | donations@tresislas.org"),
      p("www.tresislas.org"),
      p("EIN: 84-1408725 | 501(c)(3)"),
      p("PO BOX 708522, Sandy, UT 84070"),

      // ============ SECTION F ============
      new Paragraph({ children: [new PageBreak()] }),
      h1("SECTION F: Church Mission Fund Email"),
      italic("Send to the missions pastor or church office. Target churches with 200+ members."),
      hr(),
      spacer(),

      richParagraph([{ text: "Subject: ", bold: true }, "Partnership opportunity -- feeding orphans in Mexico"]),
      spacer(),
      p("Dear [CHURCH NAME] Missions Team,"),
      spacer(),
      p("My name is Kerstin Hadzik. I'm the Treasurer of the Tres Islas Orphanage Fund, a 501(c)(3) charity based in Sandy, Utah. For nearly 40 years, we've been feeding and caring for over 160 orphaned and abandoned children in six homes in Mazatlan, Mexico -- including a home for teenage girls who are survivors of violence and abuse."),
      spacer(),
      p("We are a 100% volunteer organization. No one is paid. Every dollar donated goes directly to the children. $50 feeds one child for a month."),
      spacer(),
      p("I'm reaching out because I believe our work aligns with your church's heart for international missions and caring for \"the least of these.\" We would be deeply grateful if your missions committee would consider a partnership -- whether that's a one-time gift, an annual commitment, or simply the opportunity to share our story with your congregation."),
      spacer(),
      p("I'm happy to meet with your missions team, present at a service or small group, or simply send you more information. We also welcome mission trip groups to visit the homes in Mazatlan."),
      spacer(),
      p("I've attached a one-page overview of our work. [ATTACH THE FACT SHEET FROM SECTION E]"),
      spacer(),
      p("Thank you for your time and your heart for children in need."),
      spacer(),
      p("In Christ,"),
      spacer(),
      bold("Kerstin Hadzik"),
      p("Treasurer, Tres Islas Orphanage Fund"),
      p("480-799-5118 | donations@tresislas.org"),
      p("www.tresislas.org"),

      // ============ WHAT HAPPENS NEXT ============
      new Paragraph({ children: [new PageBreak()] }),
      h1("WHAT HAPPENS AFTER YOU DO THE 5 THINGS"),
      p("Here's what to expect:"),
      spacer(),

      richParagraph([{ text: "Global Fund for Children ", bold: true }, "-- They'll review your EOI. If interested, they'll reach out to learn more. Could take 1-3 months. Potential: $5,000-$50,000."]),
      spacer(),
      richParagraph([{ text: "Montrose Foundation ", bold: true }, "-- They'll either respond or they won't. If they do, be ready with your 990 and the fact sheet. Potential: Whatever they gave before, or more."]),
      spacer(),
      richParagraph([{ text: "Rotary Clubs ", bold: true }, "-- They'll invite you to a lunch meeting within 2-4 weeks. You present for 10-15 minutes, hand out the fact sheet, answer questions. They vote on a grant at a future meeting. Potential: $500-$5,000 per club. Do 3 clubs = $1,500-$15,000."]),
      spacer(),
      richParagraph([{ text: "GlobalGiving ", bold: true }, "-- Once approved, you'll be on a platform where corporate donors, matching funds, and individual donors can find you. This is a long-term play. Potential: $5,000-$20,000/year once established."]),
      spacer(),
      richParagraph([{ text: "Churches ", bold: true }, "-- They'll either invite you to present or ask for more info. Church mission funds typically give $1,000-$10,000/year. Many renew annually. Do 3 churches = $3,000-$30,000/year."]),
      spacer(),
      hr(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "Conservative estimate from these 5 actions:", size: 26, bold: true, color: "1B4F72" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "$10,000 - $50,000 in the first year", size: 32, bold: true, color: "1B4F72" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "That alone could eliminate your annual deficit.", size: 24, italics: true, color: "555555" })]
      }),
      hr(),
      spacer(),
      italic("Everything else in the full strategy document (tres-islas-grant-strategy.md) is for round two, after these five things are done."),
    ]
  }]
});

// Generate
const buffer = await Packer.toBuffer(doc);
const outputPath = "docs/tres-islas-grant-action-kit.docx";
fs.writeFileSync(outputPath, buffer);
console.log(`Word document created: ${outputPath}`);
