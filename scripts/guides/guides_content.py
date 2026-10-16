"""Content for each Elevate STEM guide. Edit the wording here, then rerun build_guides.py.
Placeholders people fill in are wrapped in <span class="ph">[...]</span>.
Written in our own voice: students talking to students.
"""

def ph(t):
    return f'<span class="ph">[{t}]</span>'

def lines(n):
    return '<div class="lines">' + "<div></div>" * n + "</div>"

def ex(t):
    return f'<p class="ex">{t}</p>'

SIGNOFF = '<p class="signoff">— The Elevate STEM team</p>'

GUIDES = []

# ───────────────────────── Pathway to Research ─────────────────────────
GUIDES.append({"slug": "pathway-to-research", "kind": "Research guide", "html": f"""
<style>body {{ font-size: 10.6pt; line-height: 1.5; }} ol.steps > li {{ margin-bottom: 7pt; }} ol.steps p {{ margin-bottom: 3pt; }} ul li {{ margin-bottom: 1pt; }} .lede {{ margin-bottom: 10pt; }} .signoff {{ margin-top: 8pt; }}</style>
<p class="from">A free guide from Elevate STEM</p>
<h1>Pathway to Research</h1>
<p class="lede">How to go from "I think I like biology" to a finished research project. This is the path most of us followed the first time around.</p>
<ol class="steps">
<li><h3>Pick a broad topic you actually care about</h3>
<p>Something like biomedical engineering or cell biology. Research takes months, and when you get stuck (you will), it's your interest in the topic that keeps you going.</p></li>
<li><h3>Read a lot of papers in that area</h3>
<p>Say you chose biomedical engineering. You might read a paper on a new technology that lowers healthcare costs by making diagnoses more accurate, improving treatment, or making medical devices cheaper. Read widely, then pick the handful of papers you liked most.</p></li>
<li><h3>Look for gaps</h3>
<p>Go back through those papers and look for questions they leave open. A gap like that is often the seed of a really good project, and it's where your research question comes from.</p></li>
<li><h3>Form a hypothesis</h3>
<p>Once you have a question, do a focused literature review: read more papers about that specific question and take notes on each. By the end you'll have enough background to write a hypothesis.</p></li>
<li><h3>Run your experiments</h3>
<p>Now you need data to test your hypothesis. A few ways to get it:</p>
<ul>
<li>In a lab, with a mentor at a university or research institute.</li>
<li>At home, as long as it's safe and doesn't need special protective gear or equipment.</li>
<li>With computer simulations, which model what would happen in a real wet-lab experiment. They're pretty accurate, though not always.</li>
</ul></li>
<li><h3>Analyze what you found</h3>
<p>Use quantitative methods like statistics, or qualitative ones, to see whether your data supports your hypothesis.</p>
<p>If it doesn't, that's okay! Every scientist gets results they didn't expect. Use what you learned to adjust your hypothesis and try different variables. Some of the most interesting findings come from exactly this.</p></li>
<li><h3>Share it</h3>
<p>Write it up as a research paper, a poster if you're entering a competition, or even a video. Then go celebrate.</p></li>
</ol>
<p class="signoff">Good luck with your research! — The Elevate STEM team</p>
"""})

# ───────────────────────── How to Write a Research Paper ─────────────────────────
GUIDES.append({"slug": "research-paper-guide", "kind": "Research guide", "html": f"""
<p class="from">A free guide from Elevate STEM</p>
<h1>How to Write a Research Paper</h1>
<p class="lede">A research paper is how you tell other people what you found. It has five parts, and each one has a specific job. We'll use a simple experiment the whole way through: does blue light help bean plants grow?</p>

<h2>1. Introduction</h2>
<p>This is where you explain what your research is about and why anyone should care.</p>
<ul>
<li><strong>Background.</strong> What do scientists already know about your topic?{ex("Scientists have studied how plants grow under different light, but they still don't know which light works best for every plant.")}</li>
<li><strong>Problem.</strong> What question hasn't been answered yet?{ex("We don't know whether blue light helps plants grow faster than regular sunlight.")}</li>
<li><strong>Objective.</strong> What is your study trying to find out?{ex("This study tests whether blue light makes bean plants grow taller than sunlight does.")}</li>
</ul>
<p class="tip"><strong>Tip:</strong> write the introduction last. It's a lot easier once you know what your results are.</p>

<h2>2. Materials and methods</h2>
<p>What you used, and exactly what you did. Someone should be able to repeat your experiment from this section alone.</p>
<ul>
<li><strong>Subjects or samples.</strong> What or who did you study?{ex("50 bean plants grown in small pots.")}</li>
<li><strong>Tools and equipment.</strong> Machines, software, supplies.{ex("LED lamps for the blue-light group; a second group grew in regular sunlight.")}</li>
<li><strong>Procedure.</strong> Step by step, what you did.{ex("We grew the plants for four weeks, watered them every three days, and measured their height once a week.")}</li>
<li><strong>Data collection.</strong> How you recorded your measurements.{ex("Plant height, measured with a ruler and written in a lab notebook.")}</li>
</ul>

<h2>3. Results</h2>
<p>Just what you found. Save the "what it means" for the next section.</p>
<ul>
<li><strong>Key numbers.</strong> Averages, totals, anything important.{ex("Plants under blue light grew an average of 15 cm; plants in sunlight grew 12 cm.")}</li>
<li><strong>Graphs and charts.</strong> A good chart makes your results obvious at a glance.{ex("A bar graph comparing average plant height for each type of light.")}</li>
</ul>

<h2>4. Discussion</h2>
<p>Now explain what your results mean and why they matter.</p>
<ul>
<li><strong>What you learned.</strong>{ex("The plants grew taller under blue light, which suggests blue light supports growth better than sunlight.")}</li>
<li><strong>How it compares.</strong> Do other studies agree or disagree with you?{ex("Similar studies also found that blue light helps plants grow.")}</li>
<li><strong>What went wrong.</strong> Be honest about problems and how they might have affected your results.{ex("Some plants didn't grow well because their soil dried out too quickly.")}</li>
</ul>

<h2>5. Conclusion</h2>
<p>Wrap it up in a few sentences and point to what should come next.</p>
<ul>
<li><strong>Main point.</strong>{ex("Blue light helps bean plants grow taller than sunlight.")}</li>
<li><strong>Next steps.</strong>{ex("Future studies could test blue light on other kinds of plants.")}</li>
</ul>
{SIGNOFF}
"""})

# ───────────────────────── Literature Review Guide ─────────────────────────
GUIDES.append({"slug": "literature-review-guide", "kind": "Research guide", "html": f"""
<p class="from">A free guide from Elevate STEM</p>
<h1>Literature Review Guide</h1>
<p class="lede">A literature review is just a careful look at what's already been published on your topic. Here's a quick way to do one, with a little help from AI.</p>
<ol class="steps">
<li><h3>Choose your papers</h3>
<p>Pick a few papers that are closely related to your topic. Check that they're trustworthy: who wrote them, what journal they're in, and how recent they are.</p></li>
<li><h3>Upload one to ChatPDF</h3>
<p>Go to <em>chatpdf.com</em> and upload the PDF of one paper. It reads the paper and can answer your questions about it.</p></li>
<li><h3>Ask questions</h3>
<p>Start by asking for a summary. Then ask about the specifics: key findings, the methods they used, and any gaps or open questions the authors mention. Do this for each paper.</p>
<p class="tip"><strong>Heads up:</strong> AI summaries sometimes get details wrong, so double-check anything important against the actual paper.</p></li>
<li><h3>Use the gaps</h3>
<p>The gaps you found are your opening. Use them to focus your own project, and to explain what your study adds to the field.</p></li>
</ol>
{SIGNOFF}
"""})

# ───────────────────────── Cold Email Template ─────────────────────────
GUIDES.append({"slug": "cold-email-template", "kind": "Outreach template", "html": f"""
<p class="from">A free template from Elevate STEM</p>
<h1>Cold Email Template</h1>
<p class="lede">Use this to reach out to a professor about research opportunities. Swap in your own details wherever you see blue brackets, and keep it short. Professors get a lot of email.</p>
<div class="letter">
<div class="subject">Subject: High school student interested in your research on {ph("research topic")}</div>
<p>Dear Professor {ph("Last Name")},</p>
<p>My name is {ph("Your Name")}, and I'm a {ph("grade, e.g., 11th")}-grade student at {ph("School Name")}. I'm really interested in {ph("field, e.g., molecular biology or robotics")}, and I recently came across your work on {ph("specific research topic")}. I found it fascinating, especially {ph("a specific paper or project, if you have one")}.</p>
<p>I'd love to learn more about {ph("the professor's research area")}, and I wanted to ask whether there might be an opportunity to intern in your lab. I have experience with {ph("relevant skills, e.g., Python or basic lab techniques")}, and I'm excited to build on that with hands-on research.</p>
<p>I've attached my CV, and I'm happy to send anything else that would help. Thank you for taking the time to read this. I hope I get the chance to contribute to your work.</p>
<p>Best regards,<br>{ph("Your Name")}<br>{ph("Your Email Address")}<br>{ph("Your Phone Number")}</p>
</div>
<p class="note">Don't forget to attach your CV before you hit send. Our free CV template can help you make one. And if you don't hear back, a polite follow-up a week or two later is completely normal.</p>
"""})

# ───────────────────────── Grant Writing Guide ─────────────────────────
GUIDES.append({"slug": "grant-writing-guide", "kind": "Funding guide", "html": f"""
<p class="from">A free guide from Elevate STEM</p>
<h1>Grant Writing Guide</h1>
<p class="lede">If you want money for a research project or a scholarship, you'll probably have to write a grant proposal. This guide walks through the parts of one, a few tips, the mistakes we see most often, and a template you can adapt.</p>

<h2>What goes in a proposal</h2>
<ol class="steps">
<li><h3>Cover letter</h3><p>Who you are, a short summary of the project, and what you're asking for.</p></li>
<li><h3>Executive summary</h3><p>An overview of the project, what you hope to achieve, and how much funding you need.</p></li>
<li><h3>Problem statement</h3><p>The issue your project tackles, with evidence that it matters.</p></li>
<li><h3>Objectives</h3><p>Goals that are specific, measurable, achievable, relevant, and time-bound. (People call these SMART goals.)</p></li>
<li><h3>Project description</h3><p>What you'll actually do, your timeline, and who on the team is responsible for what.</p></li>
<li><h3>Budget</h3><p>An itemized list of costs, why each one is needed, and any other funding you already have.</p></li>
<li><h3>Evaluation plan</h3><p>How you'll measure whether the project worked.</p></li>
<li><h3>Appendices</h3><p>Anything that supports your case, like resumes or letters of support.</p></li>
</ol>

<div class="sec">
<h2>Tips</h2>
<ul>
<li><strong>Research the funder.</strong> Learn what they care about and shape your proposal around it.</li>
<li><strong>Follow their instructions exactly.</strong> Format, length, deadline, all of it.</li>
<li><strong>Be clear and concise.</strong> Plain language beats fancy language. Cut the filler.</li>
<li><strong>Back it up.</strong> Use data and evidence to show why your project matters.</li>
<li><strong>Proofread.</strong> Then have a friend proofread it too.</li>
</ul>
</div>

<div class="sec">
<h2>Common mistakes</h2>
<ul>
<li><strong>Ignoring the guidelines.</strong> Some funders reject proposals automatically if they don't follow the rules.</li>
<li><strong>Vague goals.</strong> "Help students learn science" is too fuzzy. Make your objectives specific and measurable.</li>
<li><strong>Promising too much.</strong> Be realistic about what you can get done during the funding period.</li>
<li><strong>No evidence.</strong> Claims without data behind them make the whole proposal weaker.</li>
<li><strong>A sloppy budget.</strong> Every cost should be realistic and explained.</li>
</ul>
</div>

<h2 style="break-before: page">Proposal template</h2>
<p class="note" style="margin-top:0">Change this to fit whatever the funder asks for.</p>
<div class="letter">
<h3 style="margin-top:0">Cover letter</h3>
<p>{ph("Your Name")}<br>{ph("Your Address")}<br>{ph("City, State, ZIP Code")}<br>{ph("Email Address")}<br>{ph("Phone Number")}<br>{ph("Date")}</p>
<p>{ph("Funder's Name")}<br>{ph("Funder's Address")}<br>{ph("City, State, ZIP Code")}</p>
<p>Dear {ph("Funder's Name")},</p>
<p>I'm writing to apply for the {ph("Grant Name")} to support {ph("Project Title")}. This project aims to {ph("briefly state the objectives")}. We are requesting {ph("amount")} to fund this work.</p>
<p>Thank you for considering our proposal.</p>
<p>Sincerely,<br>{ph("Your Name")}</p>
</div>
<div class="sec"><h3>Executive summary</h3><p>{ph("A short summary of your project: its goals, why it matters, and how much you're asking for.")}</p></div>
<div class="sec"><h3>Problem statement</h3><p>{ph("The problem your project addresses, with evidence that it matters.")}</p></div>
<div class="sec"><h3>Objectives</h3><ol style="margin:4pt 0 8pt;padding-left:16pt"><li>{ph("Objective 1")}</li><li>{ph("Objective 2")}</li><li>{ph("Objective 3")}</li></ol></div>
<div class="sec"><h3>Project description</h3><p>{ph("What you'll do, your timeline, and who does what.")}</p></div>
<div class="sec"><h3>Budget</h3>
<table><tr><th style="width:28%">Item</th><th>Description</th><th style="width:18%">Cost</th></tr>
<tr><td>{ph("Item 1")}</td><td>{ph("Description")}</td><td>{ph("Cost")}</td></tr>
<tr><td>{ph("Item 2")}</td><td>{ph("Description")}</td><td>{ph("Cost")}</td></tr>
<tr><td>{ph("Item 3")}</td><td>{ph("Description")}</td><td>{ph("Cost")}</td></tr>
<tr><td><strong>Total</strong></td><td></td><td>{ph("Total")}</td></tr></table></div>
<div class="sec"><h3>Evaluation plan</h3><p>{ph("How you'll measure success, and the methods you'll use.")}</p></div>
<div class="sec"><h3>Appendices</h3><p>{ph("Any extra documents that support your proposal.")}</p></div>
{SIGNOFF}
"""})

# ───────────────────────── CV Template ─────────────────────────
def cv_entry(org, role, bullets=2):
    lis = "".join(f"<li>{ph('Description')}</li>" for _ in range(bullets))
    return f"""<div class="entry"><div class="row"><b>{org}</b><span>{ph("Start Month Year")} – {ph("End Month Year")}</span></div>
<div class="role">{role}</div><ul>{lis}</ul></div>"""

GUIDES.append({"slug": "cv-template", "kind": "", "bare": True, "html": f"""
<div class="cv">
<div class="name">[Your Full Name]</div>
<div class="contact">{ph("Phone Number")} &nbsp;|&nbsp; {ph("Email Address")}</div>

<h2>EDUCATION</h2>
<div class="entry"><div class="row"><b>{ph("High School Name")}, {ph("City, State")}</b><span>GPA: {ph("Unweighted GPA")}</span></div>
<div class="row"><span>Class of {ph("Graduation Year")}</span><span>Expected graduation: {ph("Month Year")}</span></div></div>

<h2>VOLUNTEERING</h2>
{cv_entry(ph("Organization Name") + ", " + ph("Location"), ph("Role, e.g., Tutor"))}
{cv_entry(ph("Organization Name") + ", " + ph("Location"), ph("Role, e.g., Tutor"))}

<h2>EXTRACURRICULARS</h2>
{cv_entry(ph("Activity Name"), ph("Role, e.g., Founder"))}
{cv_entry(ph("Activity Name"), ph("Role, e.g., Founder"))}
{cv_entry(ph("Activity Name"), ph("Role, e.g., Founder"))}
{cv_entry(ph("Activity Name"), ph("Role, e.g., Founder"), 3)}

<h2>ACHIEVEMENTS</h2>
<ul><li>{ph("Achievement Name")} ({ph("Month Year Received")})</li><li>{ph("Achievement Name")} ({ph("Month Year Received")})</li></ul>

<h2>SKILLS</h2>
<ul><li>{ph("Skill, e.g., Python programming")}</li><li>{ph("Skill, e.g., Spanish (conversational)")}</li></ul>
</div>
"""})

# ───────────────────────── Brag Sheet ─────────────────────────
def fill(*labels):
    return '<div class="fill">' + "".join(f'<span>{l}</span><span class="line"></span>' for l in labels) + "</div>"

def table(cols, rows=4, widths=None):
    th = "".join(f'<th style="width:{w}">{c}</th>' if widths else f"<th>{c}</th>" for c, w in zip(cols, widths or cols))
    tr = ("<tr>" + "<td></td>" * len(cols) + "</tr>") * rows
    return f"<table><tr>{th}</tr>{tr}</table>"

QUESTIONS = [
    "What are three words you'd use to describe yourself, and why?",
    "What have you enjoyed most about this class or teacher?",
    "Why did you choose this person to write your recommendation?",
    "Describe a moment in this class when you felt especially proud or challenged.",
    "What's something important about you that your teacher might not know?",
    "What is one extracurricular you're passionate about, and why?",
    "What makes you different from your peers?",
    "Have you faced any major challenges? How did you grow from them?",
    "Is there anything else you'd like your recommender to highlight?",
]

GUIDES.append({"slug": "brag-sheet", "kind": "College template", "html": f"""
<p class="from">A free template from Elevate STEM</p>
<h1>Student Brag Sheet</h1>
<p class="lede">Teachers write a lot of recommendation letters, and they can't remember everything you've done. Fill this out and hand it to them, so they know exactly what to highlight.</p>
<div class="sec"><h2>Basic info</h2>{fill("Name", "Email", "Graduation year", "Recommender's name (optional)")}</div>
<div class="sec"><h2>Academic snapshot</h2>{fill("GPA (weighted / unweighted)", "Test scores (SAT, ACT, AP, IB, other)", "Courses taken with this teacher")}</div>
<div class="sec"><h2>College and career goals</h2>{fill("Colleges you're applying to", "Intended major", "Career interests")}</div>
<div class="sec"><h2>Top activities and involvement</h2>
<p class="note" style="margin-top:0">Include clubs, volunteer work, internships, jobs, hobbies, or personal projects.</p>
{table(["Activity", "Grades", "Role or title", "What you did and the impact"], 4, ["24%", "12%", "18%", "46%"])}</div>
<div class="sec"><h2>Awards, honors, and achievements</h2>
{table(["Award or title", "Year", "Description"], 3, ["32%", "12%", "56%"])}</div>
<h2 style="break-before: page">Reflection questions</h2>
{"".join(f'<div class="q"><strong>{i}. {q}</strong>{lines(2)}</div>' for i, q in enumerate(QUESTIONS, 1))}
"""})

# ───────────────────────── Quad Chart ─────────────────────────
GUIDES.append({"slug": "quad-chart", "kind": "", "bare": True, "landscape": True, "html": """
<div class="quad">
<header><div><h1>[Project Title]</h1><p>By: [Names], [School], [City, State]</p></div><div class="pid">Project ID<b></b></div></header>
<div class="grid">
<div class="cell"><h2>Q1: Research question</h2><p>What question does your project answer, and why does it matter?</p></div>
<div class="cell b"><h2>Q3: Data analysis and results</h2><p>What did you find? Add your key numbers, graphs, or charts.</p></div>
<div class="cell b"><h2>Q2: Methodology</h2><p>How did you run your experiment or build your project?</p></div>
<div class="cell"><h2>Q4: Interpretation and conclusions</h2><p>What do your results mean, and what would you do next?</p></div>
</div></div>
"""})
