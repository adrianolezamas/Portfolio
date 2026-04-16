import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Accept GET or POST
  const params = req.method === 'POST'
    ? req.body
    : Object.fromEntries(new URL(req.url, `https://${req.headers.host}`).searchParams);

  const { name, email, pkg, total } = params;

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Guard: only send once per request (idempotency handled by caller)
  try {
    await resend.emails.send({
      from: 'Adriano Lezama Photography <noreply@adrianolezamas.com>',
      to:   email,
      reply_to: 'adrlezama@gmail.com',
      subject: `Payment confirmed — See you on the pitch, ${name}!`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 0 40px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;" align="center">
          <table cellpadding="0" cellspacing="0" align="center">
            <tr><td style="background:#1a1a1a;border-radius:50%;padding:14px;text-align:center;line-height:0;">
              <a href="https://adrianolezamas.com" target="_blank" style="text-decoration:none;display:block;line-height:0;">
                <svg width="56" height="56" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                  <path fill="#ffffff" d="M169.699799,708.686401 C180.258072,696.424438 185.475769,681.740479 191.447784,667.465027 C220.114960,598.939026 248.762558,530.404907 277.397583,461.865448 C307.444794,389.945801 337.297974,317.943909 367.736938,246.190475 C371.273438,237.853912 370.851837,232.382278 365.143707,225.368103 C344.344635,199.810074 318.849304,182.042191 285.803192,177.688232 C262.039490,174.557312 238.663223,178.399124 216.095322,186.625504 C210.983932,188.488693 210.166473,187.901642 208.637787,183.018234 C207.555466,179.560730 209.515381,178.567307 211.994659,177.569244 C223.127426,173.087692 234.460632,169.236740 246.088562,166.219879 C265.346313,161.223511 284.805664,158.405563 304.791565,158.523849 C327.662231,158.659195 348.118378,166.152206 367.910400,176.711761 C394.444763,190.868530 412.321716,213.382553 428.295563,237.914703 C446.077087,265.223083 457.899689,295.324097 468.920410,325.683350 C490.734100,385.774750 511.859802,446.116089 533.232544,506.367371 C547.923950,547.783630 562.291931,589.316833 577.284424,630.623596 C591.387268,669.479187 607.205322,707.656250 627.606323,743.696045 C647.435059,778.724792 669.756470,812.087952 698.003418,841.033203 C725.451904,869.160278 758.797241,886.172058 797.772339,891.413818 C811.331421,893.237366 825.020325,891.525146 838.574524,889.677185 C843.126709,889.056641 844.552063,890.635254 844.107300,895.150269 C843.866821,897.591492 842.388000,898.512817 840.328979,899.165527 C807.764771,909.488342 774.601257,913.814880 740.840759,906.932617 C717.220520,902.117493 695.955994,891.355469 676.224365,877.582520 C633.957703,848.080017 602.489441,809.117798 577.155884,764.735901 C554.100708,724.345703 536.644653,681.536743 521.766235,637.587402 C512.799561,611.100769 503.570740,584.702576 494.685791,558.188782 C492.998718,553.154297 490.444641,551.178833 484.968353,551.192993 C419.476318,551.361694 353.983612,551.334900 288.491364,551.212036 C284.307617,551.204224 282.337036,552.628418 280.845245,556.497559 C264.490662,598.915222 247.946396,641.259705 231.494064,683.639771 C228.473282,691.421021 225.308365,699.445251 226.658508,707.847778 C228.987473,722.342102 237.950027,734.528015 259.676636,734.620605 C262.695221,734.633484 265.231262,734.660583 265.400940,738.904175 C265.592163,743.685913 262.765076,743.904663 259.331299,743.904236 C238.833664,743.901733 218.336029,743.936035 197.838394,743.940674 C170.508194,743.946899 143.177994,743.950012 115.847832,743.916016 C112.876167,743.912354 109.590988,744.305664 109.599167,739.616760 C109.604828,736.373108 110.600639,734.689331 114.159805,734.637268 C136.396301,734.311890 154.865036,725.767334 169.699799,708.686401 M477.372070,507.042999 C474.978088,499.946350 472.597076,492.845245 470.187958,485.753754 C457.126862,447.307190 443.994415,408.884735 431.013672,370.411072 C420.847992,340.280975 410.560913,310.201050 397.624054,281.113129 C396.178192,277.862122 395.147003,274.289337 392.339874,271.705780 C389.274445,275.400757 293.569244,520.919434 293.142456,526.035217 C295.646118,527.164490 298.343719,526.708313 300.944550,526.710327 C358.922119,526.755066 416.899750,526.750549 474.877350,526.749451 C476.209015,526.749390 477.549805,526.765869 478.870483,526.625427 C482.010162,526.291626 483.344818,524.691895 482.262268,521.510010 C480.707550,516.940491 479.167480,512.365967 477.372070,507.042999 z"/>
                  <path fill="#ffffff" d="M896.244141,625.457886 C906.507141,631.775635 910.592041,642.165527 908.564819,655.048706 C904.525330,680.719666 898.880798,706.044312 892.568115,731.234070 C888.029053,749.346130 876.568359,758.421936 857.939087,757.792480 C837.275513,757.094299 816.615112,757.408142 795.954407,757.353821 C756.454895,757.250000 716.954834,757.282349 677.455566,757.423035 C673.315063,757.437744 670.737244,756.145752 668.500671,752.622925 C650.399109,724.111206 635.810120,693.833740 622.747620,662.760864 C605.241699,621.117737 591.295044,578.174072 576.198608,535.651855 C552.355652,468.493622 528.637024,401.291290 504.872223,334.105347 C494.926453,305.987457 484.129852,278.210571 471.288513,251.272308 C464.894562,237.859192 457.157227,225.211441 448.666199,213.021515 C447.280579,211.032272 445.566101,209.166931 445.241486,206.657059 C447.321075,205.144073 449.381683,205.706833 451.303406,205.706009 C523.136292,205.674973 594.969177,205.678101 666.802063,205.685699 C676.668091,205.686737 682.667664,209.954010 685.520081,218.927200 C688.061768,226.922867 685.197815,235.348450 677.960938,240.505905 C674.573975,242.919617 670.947693,244.997040 667.434937,247.234772 C654.067871,255.750107 647.138428,267.535187 647.157043,283.783142 C647.310425,417.782135 647.272461,551.781311 647.216980,685.780457 C647.213745,693.647095 648.711731,700.687134 655.159912,705.855835 C658.516418,708.546204 662.378723,709.926147 666.716797,709.941162 C698.880859,710.052368 731.081726,711.126892 763.197632,709.479492 C798.632812,707.661743 826.073608,691.614197 843.707031,660.062988 C847.603760,653.090637 851.903564,646.313538 856.427124,639.727661 C865.214722,626.933777 881.962830,619.045959 896.244141,625.457886 z"/>
                  <path fill="#ffffff" d="M480.735657,612.407837 C497.111481,661.509338 513.749512,710.081726 537.317444,755.539185 C535.193298,757.905945 533.251160,757.352173 531.516785,757.353821 C499.880646,757.384949 468.244446,757.394287 436.608368,757.352966 C426.751953,757.340088 420.747437,753.041870 418.172607,744.398926 C415.457397,735.284790 418.148865,727.461426 426.086243,722.220520 C429.686279,719.843506 433.487457,717.741577 437.320892,715.752930 C452.161774,708.054260 459.774414,696.007019 459.751495,679.192505 C459.710358,649.054932 459.697937,618.917236 459.755585,588.779785 C459.760529,586.204590 458.499298,582.667908 462.836731,582.065552 C467.023010,581.484192 470.546387,581.707581 472.095551,586.996521 C474.570984,595.447693 477.722839,603.700806 480.735657,612.407837 z"/>
                </svg>
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#141414;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">

          <!-- Header -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#0e0e0e;padding:36px 44px 32px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#c8a96e;">Adriano Lezama Photography</p>
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:-0.02em;line-height:1.25;">Payment Confirmed.</h1>
              <p style="margin:0;font-size:14px;color:#666;letter-spacing:0.01em;">You're officially locked in, ${name}.</p>
            </td></tr>
          </table>

          <!-- Body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 44px 32px;">
              <p style="margin:0 0 18px;font-size:14px;color:#aaa;line-height:1.85;">Thank you so much — your payment has been received and your spot is secured. I'm genuinely excited and truly looking forward to being part of your team and capturing something special together.</p>
              <p style="margin:0 0 18px;font-size:14px;color:#aaa;line-height:1.85;">I'll be in touch before your event with everything you need to know. In the meantime, don't hesitate to reach out directly — I'm always happy to chat.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px 22px;background:#0e0e0e;border-radius:10px;border:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#555;">Direct contact</p>
                    <p style="margin:0;font-size:16px;font-weight:500;color:#c8a96e;letter-spacing:0.02em;">438-393-3752</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          ${pkg || total ? `
          <!-- Summary -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 44px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;border-radius:10px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
                <tr><td style="padding:14px 22px;border-bottom:1px solid rgba(255,255,255,0.05);">
                  <p style="margin:0;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#555;">Payment Receipt</p>
                </td></tr>
                <tr><td style="padding:6px 22px 6px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${pkg ? `<tr>
                      <td style="font-size:12px;color:#555;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Package</td>
                      <td style="font-size:12px;color:#ccc;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${pkg}</td>
                    </tr>` : ''}
                    ${total ? `<tr>
                      <td style="font-size:13px;color:#e2e2e2;font-weight:500;padding:14px 0 6px;">Amount paid</td>
                      <td style="font-size:20px;color:#c8a96e;font-weight:500;text-align:right;padding:14px 0 6px;">${total}</td>
                    </tr>` : ''}
                  </table>
                </td></tr>
              </table>
            </td></tr>
          </table>
          ` : ''}

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 44px;"><div style="height:1px;background:rgba(255,255,255,0.05);"></div></td></tr>
          </table>

          <!-- Social links -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:30px 44px 36px;">
              <p style="margin:0 0 16px;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#444;">Follow Along</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="https://www.instagram.com/byadriano_/" target="_blank" style="display:table;background:#1a1a1a;border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:11px 18px;text-decoration:none;">
                      <table cellpadding="0" cellspacing="0"><tr>
                        <td style="padding-right:9px;vertical-align:middle;">
                          <img src="https://cdn-icons-png.flaticon.com/24/2111/2111463.png" width="15" height="15" alt="" style="display:block;">
                        </td>
                        <td style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#e2e2e2;font-family:'Helvetica Neue',Arial,sans-serif;vertical-align:middle;">@byadriano_</td>
                      </tr></table>
                    </a>
                  </td>
                  <td>
                    <a href="https://adrianolezamas.com" target="_blank" style="display:table;background:#1a1a1a;border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:11px 18px;text-decoration:none;">
                      <table cellpadding="0" cellspacing="0"><tr>
                        <td style="padding-right:9px;vertical-align:middle;">
                          <svg width="15" height="15" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="display:block;opacity:0.8;">
                            <path fill="#ffffff" d="M169.699799,708.686401 C180.258072,696.424438 185.475769,681.740479 191.447784,667.465027 C220.114960,598.939026 248.762558,530.404907 277.397583,461.865448 C307.444794,389.945801 337.297974,317.943909 367.736938,246.190475 C371.273438,237.853912 370.851837,232.382278 365.143707,225.368103 C344.344635,199.810074 318.849304,182.042191 285.803192,177.688232 C262.039490,174.557312 238.663223,178.399124 216.095322,186.625504 C208.637787,183.018234 209.515381,178.567307 211.994659,177.569244 C223.127426,173.087692 246.088562,166.219879 265.346313,161.223511 C284.805664,158.405563 304.791565,158.523849 367.910400,176.711761 C394.444763,190.868530 468.920410,325.683350 533.232544,506.367371 C577.284424,630.623596 627.606323,743.696045 698.003418,841.033203 C758.797241,886.172058 797.772339,891.413818 844.107300,895.150269 C840.328979,899.165527 740.840759,906.932617 676.224365,877.582520 C577.155884,764.735901 494.685791,558.188782 484.968353,551.192993 C353.983612,551.334900 288.491364,551.212036 280.845245,556.497559 C247.946396,641.259705 226.658508,707.847778 259.676636,734.620605 C265.400940,738.904175 197.838394,743.940674 109.599167,739.616760 C114.159805,734.637268 154.865036,725.767334 169.699799,708.686401 M477.372070,507.042999 C457.126862,447.307190 431.013672,370.411072 392.339874,271.705780 C293.142456,526.035217 474.877350,526.749451 482.262268,521.510010 C479.167480,512.365967 477.372070,507.042999 z"/>
                            <path fill="#ffffff" d="M896.244141,625.457886 C910.592041,642.165527 892.568115,731.234070 857.939087,757.792480 C677.455566,757.423035 622.747620,662.760864 504.872223,334.105347 C445.241486,206.657059 666.802063,205.685699 685.520081,218.927200 C647.157043,283.783142 647.216980,685.780457 666.716797,709.941162 C763.197632,709.479492 843.707031,660.062988 896.244141,625.457886 z"/>
                            <path fill="#ffffff" d="M480.735657,612.407837 C537.317444,755.539185 436.608368,757.352966 418.172607,744.398926 C426.086243,722.220520 459.755585,588.779785 472.095551,586.996521 C477.722839,603.700806 480.735657,612.407837 z"/>
                          </svg>
                        </td>
                        <td style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#e2e2e2;font-family:'Helvetica Neue',Arial,sans-serif;vertical-align:middle;">adrianolezamas.com</td>
                      </tr></table>
                    </a>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;color:#3a3a3a;line-height:1.7;">Questions? Reply to this email or call <a href="tel:+14383933752" style="color:#555;text-decoration:none;">438-393-3752</a></p>
          <p style="margin:0;font-size:10px;color:#2a2a2a;letter-spacing:0.1em;text-transform:uppercase;">© 2026 · Adriano Lezama Photography</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Payment confirm email error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
