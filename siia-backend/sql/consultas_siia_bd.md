#Cadetes prontos

SELECT * FROM (
    SELECT
        cc.id_pessoa,
        cc.abrev_posto_grad,
        cc.numero,
        CASE 
            WHEN cc.ano = 0 THEN 'Espcex'
            WHEN cc.ano = 1 THEN '1º Ano'
            WHEN cc.ano = 2 THEN '2º Ano'
            WHEN cc.ano = 3 THEN '3º Ano'
            WHEN cc.ano = 4 THEN '4º Ano'
            ELSE CAST(cc.ano AS VARCHAR)
        END AS ano,
        cc.sigla_cur_aman,
        cc.cod_tu,
        cc.ano_letivo_turma,
        UPPER(cc.nome) AS nome,
        UPPER(cc.nome_guerra) AS nome_guerra,
        cc.login,
        cc.subunidade,
        cc.fracao,
        cc.pais,
        cc.estrangeiro,
        UPPER(cc.cod_sexo) AS cod_sexo,
        cc.idt_mil,
        cc.cpf,
        cc.dt_nasc,
        cc.num_end,
        UPPER(cc.logradouro) AS logradouro,
        UPPER(cc.compl_end) AS compl_end,
        UPPER(cc.bairro) AS bairro,
        UPPER(cc.cidade) AS cidade,
        UPPER(cc.uf) AS uf,
        cc.prec_cp,
        cc.nome_religiao,
        cc.num_tel,
        cc.nome_pai,
        cc.nome_mae,
        cc.profissao_pai,
        cc.profissao_mae,
        LOWER(cc.email) AS email,
        cc.tipo_sang,
        UPPER(cc.cidade_nat) AS cidade_nat,
        cc.uf_nat,
        cc.regiao_nat,
        ca.curso_aman,
        ic.doador_org,
        ec.est_civ,
        TRIM(to_char(ic.altura::real, '9.99')) AS altura,
        ic.peso
    FROM
        pessoal.cadastro_de_cadetes cc
        INNER JOIN pessoal.info_cadete ic ON cc.id_pessoa = ic.cod_pessoa
        INNER JOIN pessoal.pessoa p ON ic.cod_pessoa = p.cod_pessoa
        INNER JOIN pessoal.estado_civil ec ON p.cod_est_civ = ec.cod_est_civ
        INNER JOIN ensino.curso_aman ca ON cc.cod_cur_aman = ca.cod_cur_aman
    WHERE
        p.cod_posto_grad = 60
        AND p.cod_sit = 1
) AS "source";


