CNC SCULPT AI - ONLINE HOSTING FILES

1. GitHub par naya repository banayein: cnc-sculpt-ai
2. Is ZIP ke andar ki sabhi files repository mein upload karein.
3. Render.com par sign in karke New > Blueprint select karein.
4. Apna GitHub repository connect karein.
5. Render render.yaml ko read karke service banayega.
6. Deploy complete hone par Render aapko public URL dega.

IMPORTANT:
- render.yaml mein plan "standard" (2 GB RAM) paid always-on server ke liye set hai.
- Free plan par service sleep/cold-start kar sakti hai; guaranteed 24/7 nahi.
- First deploy mein PyTorch aur AI model download hone ke karan time aur RAM zyada lag sakti hai. 2 GB RAM par memory limit ka risk ho sakta hai; agar deploy crash ho to 4 GB RAM plan chahiye ho sakta hai.
- Paid deployment confirm karne se pehle Render dashboard par current price, RAM aur disk limits check karein.
- Existing HTML/CSS/3D relief/STL features preserve kiye gaye hain.
- API URL ko relative "/generate-depth" kiya gaya hai, isliye frontend aur backend same Render service par chalenge.
