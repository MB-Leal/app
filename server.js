const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const mysql = require ('mysql');
const buscaCep = require("busca-cep");
const nodemailer = require('nodemailer');
const axios = require ("axios");

const dreams = [
  "Find and count some sheep",
  "Climb a really tall mountain",
  "Wash the dishes"
];


app.use(express.static("public"));


app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.post("/Delivery", function(request, response) {
var intentName = request.body.queryResult.intent.displayName;
 var connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB 
 });
 //connection.connect();
 connection.connect(function(error) {
    if (error) {
      throw error;
      response.json({ fulfillmentText: "⚙ Erro de Conexão com o BD! Tente novamente em instantes!"
      });
    }
  });
  
  if(intentName == 'Adicionar_contato'){ 
    console.log('Adicionar Contato') 
    var nomeContato = request.body.queryResult.parameters['nome'];
    var cpf = request.body.queryResult.parameters['cpf'];
    var telefoneContato = request.body.queryResult.parameters['telefone']; 
    var query = 'insert into tb_cliente values (NULL,"'+nomeContato+'","'+cpf+'","'+telefoneContato+'")'; 
    connection.query(query, function (error, results, fields) { 
      if (error) throw error; 
      connection.end(); 
      response.json({"fulfillmentText" :"Contato Adicionado com Sucesso!" }) 
    }); 
  }
  if (intentName == "3_Listar") {
    var fnome = request.body.queryResult.parameters["nome"];
    if (fnome == "*")
      var fQuery = "select * from tb_cliente order by nome";
    else
      var fQuery = 'select * from tb_cliente where nome like "%' + fnome + '%" order by nome';

    connection.query(fQuery, function(error, results, fields) {
      if (results.length == 0) {
        response.json({
          fulfillmentText:
            "⚠ Não localizei com esta incidência ! Digite Listar novamente. "
        });
      } else {
        var fQtReg = results.length;
        var fLstReg = "";
        for (var x = 0; x < fQtReg; x++) {
          fLstReg +=
            " 📒 Nome: " +
            results[x].nome +
            " CPF: " +
            results[x].numcpf +
            " Telefone: " +
            results[x].telefone +
            "\n";
        }
        fLstReg += "---------------------------\n\n";
        fLstReg += "☑️ " + fQtReg + " Registros encontrados";
        response.json({ fulfillmentText: fLstReg });
      }
      connection.end();
    });
  }

  if (intentName == "4_Excluir") {
    var fnome = request.body.queryResult.parameters["nome"];
    var fQuery = 'delete from tb_cliente where nome = "' + fnome + '"';

    connection.query(fQuery, function(error, results, fields) {
      if (results.affectedRows == 0)
        response.json({
          fulfillmentText:
            "⚠ Não localizei! Digite Pesquisar para verificar se o nome realmente existe."
        });
      else
        response.json({
          fulfillmentText: "" + fnome + " foi excluido com sucesso!"
        });

      connection.end();
    });
  }

  if (intentName == "5_Atualizar") {
    var fnome = request.body.queryResult.parameters["nome"];
    var fQuery = 'select * from tb_cliente where nome = "' + fnome + '"';
    connection.query(fQuery, function(error, results, fields) {
      if (results.length == 0)
        response.json({
          fulfillmentText:
            "⚠ Não localizei! Digite Pesquisar para verificar se o nome realmente existe."
        });
      else {
        var contato =
          "Deseja alterra os dados de *" +
          fnome +
          "*" +
          " os são CPF=" +
          results[0].numcpf +
          ", Telefone=" +
          results[0].telefone +
          "\n [SIM] ou [NÂO]";
        response.json({ fulfillmentText: contato });
      }
      connection.end();
    });
  }

  if (intentName == "5_Atualizar_Sim") {
    var fnome = request.body.queryResult.outputContexts[0].parameters["nome"];
    var fnumcpf = request.body.queryResult.parameters["cpf"];
    var ftelefone = request.body.queryResult.parameters["telefone"];
    var fQuery =
      'update tb_cliente set numcpf="' +
      fnumcpf +
      '", telefone="' +
      ftelefone +
      '" where nome = "' +
      fnome +
      '"';
    connection.query(fQuery, function(error, results, fields) {
      if (results.changedRows == 0)
        response.json({
          fulfillmentText:
            "⚠ ocorreu um erro inesperado(51) ! Tente novamente, digite Atualizar."
        });
      else {
        var contato =
          "*" +
          fnome +
          "*" +
          ", agora seu NOVO CPF é " +
          fnumcpf +
          ", e seu NOVO TELEFONE é " +
          ftelefone;
        response.json({ fulfillmentText: contato });
      }
      connection.end();
    });
  }

  if (intentName == "5_Atualizar_Nao") {
    response.json({ fulfillmentText: "🤖 Ok! Os Dados não atualizado!!" });
  }

  if (intentName== "0_Encerrar") {
    response.json({
      fulfillmentText:
        "🤖 Conexão encerrada! Obrigado por Interagir aqui "
    });
    connection.end();
  }

//=======================================================================================

if (intentName == 'Cadastro Planilha'){
  var Nome = request.body.queryResult.parameters['nome'];
  var resNome = Nome.toUpperCase(Nome);
  var Telefone = request.body.queryResult.parameters['telefone'];
  var resTelefone = Telefone.toUpperCase(Telefone);
  
  const data = [{
    Nome: resNome,
    Telefone: resTelefone
    }];
  axios.post ('https://sheetdb.io/api/v1/7nvryedhnduyg', data);
  response.json({"fulfillmentText": resNome + " Foi adicionado com sucesso!" });
  }

if(intentName == 'Consulta Planilha'){
  var Nome = request.body.queryResult.parameters['nome'];
  var resNome = Nome.toUpperCase();
  return axios.get("https://sheetdb.io/api/v1/7nvryedhnduyg").then(res => {
 res.data.map(person => {
 if (person.Nome === resNome){
 response.json({"fulfillmentText" :"Detalhes do cadastro: "+
 "Nome: "+person.Nome+"\n"+
 "Telefone: "+person.Telefone});   
 }
 });
 });
 }
  
  
  
  });
  /*
if(intentName == "Teste"){
  response.json({ "fulfillmentText" : "Isso aqui é um Teste." });  
}
   //==============================================================================================================
  
  if (intentName == "Atendimento_inicial - consultar_pedido") {
    var nome = request.body.queryResult.parameters["nome"];
    if (nome == "*")
      var fQuery = "select * from delivery order by nome asc";
    else
      var data = new Date();
      var dia = data.getDate();
      var mes = data.getMonth();
      var ano = data.getFullYear();
      var str_data = ano + '-' + (mes+1) + '-' + dia;
    
      var fQuery = 'select * from delivery where nome like "%' + nome + '%"and data like "'+str_data+'%" order by nome asc';
    
    connection.query(fQuery, function(error, results, fields) {
      if (results.length == 0) {
        response.json({
          fulfillmentText:
            "⚠ Não localizei *nenhum* pedido com esse nome ! "
        });
      } else {
        var fQtReg = results.length;
        var fLstReg = "";
        for (var x = 0; x < fQtReg; x++) {
          fLstReg +=
            " 📒 Nome: " +
            results[x].nome +
            " Telefone: " +
            results[x].telefone +
            " Pedido: " +
            results[x].produto +
            " Status: " +
            results[x].status +
            "\n";
        }
        fLstReg += "---------------------------\n\n";
        fLstReg += "☑️ " + fQtReg + " Registros encontrados";
        response.json({ fulfillmentText: fLstReg });        
      }
      connection.end();
    });
  }
  if (intentName == "Atendimento_inicial - alterar_pedido") {
    
    var telefone = request.body.queryResult.parameters["telefone"];
    var data = new Date();
    var dia = data.getDate();
    var mes = data.getMonth();
    var ano = data.getFullYear();
    var str_data = ano + '-' + (mes+1) + '-' + dia;
    
    var fQuery = 'select * from delivery where telefone like "%' + telefone + '%"and data like "'+str_data+'%" order by nome asc'
    //var fQuery = 'select * from delivery where telefone = "' + telefone + '"';
    connection.query(fQuery, function(error, results, fields) {
      if (results.length == 0)
        response.json({
          fulfillmentText:
            "⚠ Não localizei seu pedido!"
        });
      else {
        var dados ="Deseja alterra os dados de "+ results[0].nome +"? SIM ou NÃO";
        response.json({ fulfillmentText: dados });
      }
      connection.end();
    });
  }
  
   if (intentName == "Atualizar_Sim") {
    var fnome = request.body.queryResult.outputContexts[0].parameters["nome"];
    var fnumcpf = request.body.queryResult.parameters["cpf"];
    var ftelefone = request.body.queryResult.parameters["telefone"];
    var fQuery =
      'update tb_cliente set numcpf="' +
      fnumcpf +
      '", telefone="' +
      ftelefone +
      '" where nome = "' +
      fnome +
      '"';
    connection.query(fQuery, function(error, results, fields) {
      if (results.changedRows == 0)
        response.json({
          fulfillmentText:
            "⚠ ocorreu um erro inesperado(51) ! Tente novamente, digite Atualizar."
        });
      else {
        var contato =
          "*" +
          fnome +
          "*" +
          ", agora seu NOVO CPF é " +
          fnumcpf +
          ", e seu NOVO TELEFONE é " +
          ftelefone;
        response.json({ fulfillmentText: contato });
      }
      connection.end();
    });
  }
  
  
  //==============================================================================================================
  if(intentName == 'Adicionar_contato'){ 
    console.log('Adicionar Contato') 
    var NomeContato = request.body.queryResult.parameters['nome']; 
    var TelefoneContato = request.body.queryResult.parameters['telefone']; 
    var query = 'insert into cadastro values ("'+NomeContato+'","'+TelefoneContato+'")'; 
    connection.query(query, function (error, results, fields) { 
      if (error) throw error; 
      connection.end(); 
      response.json({"fulfillmentText" :"Contato Adicionado com Sucesso!" }) 
    }); 
  }else if(intentName == 'Excluir_contato'){ 
    console.log('Excluir_contato') 
    var TelefoneContato = request.body.queryResult.parameters['telefone']; 
    var query = 'delete from cadastro where telefone = "'+TelefoneContato+'"'; 
    connection.query(query, function (error, results, fields) { 
      if (error) throw error; 
      connection.end(); 
      response.json({"fulfillmentText":"Contato Apagado com Sucesso!" }) 
    }); 
  }else if(intentName == 'Pesquisar_contato'){ 
    console.log('Pesquisar Contato'); 
    var TelefoneContato = request.body.queryResult.parameters['telefone'];    
    var query = 'select * from cadastro where cadastro.telefone = "'+TelefoneContato+'"'; 
    connection.query(query, function (error, results, fields) { 
      if (error) throw error; 
      connection.end(); 
      var contato = ''; 
      contato = 'Nome: '+results[0].nome+"\n"+'Telefone: '+results[0].telefone; 
      response.json({"fulfillmentText": contato }) 
    }); 
  }
  
  if(intentName == 'Listar_contatos'){ 
    console.log('Listar Contatos'); 
    //var TelefoneContato = request.body.queryResult.parameters['telefone'];    
    var query = 'select * from cadastro '; 
    connection.query(query, function (error, results, fields) { 
      //if (error) throw error; 
      //connection.end(); 
      if (results.length == 0) {
        response.json({
          fulfillmentText: "⚠ Não localizei pedido no seu nome!" });
      }else {
        var fQtReg = results.length;
        var fLstReg = "";
        for (var x = 0; x < fQtReg; x++) {
          fLstReg += " 📒 *Nome:* " + results[x].nome + "\n *Telefone:* " + results[x].telefone + "\n";
        }
        response.json({ fulfillmentText: fLstReg });
      }
      connection.end();
    });
  }
     //Mostrar data
  if(intentName == "Saber_data"){
    var data = new Date();
    var dia     = data.getDate();           // 1-31
    var dia_sem = data.getDay();            // 0-6 (zero=domingo)
    var mes     = data.getMonth();          // 0-11 (zero=janeiro)
    var ano2    = data.getYear();           // 2 dígitos
    var ano4    = data.getFullYear();       // 4 dígitos
    var hora    = data.getHours();          // 0-23
    var min     = data.getMinutes();        // 0-59
    var seg     = data.getSeconds();        // 0-59
    var mseg    = data.getMilliseconds();   // 0-999
    var tz      = data.getTimezoneOffset(); // em minutos

    // Formata a data e a hora (note o mês + 1)
    var str_data = dia + '/' + (mes+1) + '/' + ano4;
    var str_hora = hora + ':' + min + ':' + seg;
   
  response.json({ "fulfillmentText" : "Data: "+str_data+" Hora: "+str_hora});
}
  //Pesquisar CEP
  
  if (intentName == "Pesquisar_cep") {
    var CEP = request.body.queryResult.parameters["cep"];
    buscaCep(CEP, { sync: false, timeout: 1000 }).then(endereco => {
      var local = endereco.logradouro +" - "+ endereco.bairro +"\n"+ endereco.localidade +" - "+ endereco.uf +"\n"+ endereco.cep;
      response.json({ "fulfillmentText" : "Ok, seu CEP está confirmado:" + "\n" + local});
});
}
  
if(intentName == 'Enviar_email'){
  var destinatario = request.body.queryResult.parameters["email"];
  //var destinatario = request.body.queryResult.parameters["destinatario"];
  var assunto = request.body.queryResult.parameters["assunto"];
  var mensagem = request.body.queryResult.parameters["mensagem"];
  var nodemailer = require('nodemailer');
  
  var transporte = nodemailer.createTransport({
    service: 'Outlook', //servidor a ser usado
    auth: {
      user: process.env.user, // dizer qual o usuário
      pass: process.env.pass // senha da conta
      }
    });
  
  var email = {
    from: process.env.user, // Quem enviou este e-mail
    to: destinatario, // Quem receberá
    subject: assunto, // Um assunto
    html: mensagem // O conteúdo do e-mail
    };
  
  transporte.sendMail(email, function(error, info){
    if(error)
      console.log (error);
    throw error; // algo de errado aconteceu.
    //console.log('Email enviado! Leia as informações adicionais: '+ info);
    response.json({ "fulfillmentText" : "Email enviado! Leia as informações adicionais " + info});
    });
  }
  
  
});
*/
/*
app.get("/dreams", (request, response) => {
  // express helps us take JS objects and send them as JSON
  response.json(dreams);
});


const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
*/



//---------------------------------------------------------------------    

  if (intentName == "3_Listar") {
    var fnome = request.body.queryResult.parameters["nome"];
    if (fnome == "*")
      var fQuery = "select * from tb_cliente order by nome";
    else
      var fQuery = 'select * from tb_cliente where nome like "%' + fnome + '%" order by nome';

    connection.query(fQuery, function(error, results, fields) {
      if (results.length == 0) {
        response.json({
          fulfillmentText:
            "⚠ Não localizei com esta incidência ! Digite Listar novamente. "
        });
      } else {
        var fQtReg = results.length;
        var fLstReg = "";
        for (var x = 0; x < fQtReg; x++) {
          fLstReg +=
            " 📒 Nome: " +
            results[x].nome +
            " CPF: " +
            results[x].numcpf +
            " Telefone: " +
            results[x].telefone +
            "\n";
        }
        fLstReg += "---------------------------\n\n";
        fLstReg += "☑️ " + fQtReg + " Registros encontrados";
        response.json({ fulfillmentText: fLstReg });
      }
      connection.end();
    });
  }

  if (NomedaIntent == "4_Excluir") {
    var fnome = request.body.queryResult.parameters["nome"];
    var fQuery = 'delete from tb_cliente where nome = "' + fnome + '"';

    connection.query(fQuery, function(error, results, fields) {
      if (results.affectedRows == 0)
        response.json({
          fulfillmentText:
            "⚠ Não localizei! Digite Pesquisar para verificar se o nome realmente existe."
        });
      else
        response.json({
          fulfillmentText: "" + fnome + " foi excluido com sucesso!"
        });

      connection.end();
    });
  }

  if (NomedaIntent == "5_Atualizar") {
    var fnome = request.body.queryResult.parameters["nome"];
    var fQuery = 'select * from tb_cliente where nome = "' + fnome + '"';
    connection.query(fQuery, function(error, results, fields) {
      if (results.length == 0)
        response.json({
          fulfillmentText:
            "⚠ Não localizei! Digite Pesquisar para verificar se o nome realmente existe."
        });
      else {
        var contato =
          "Deseja alterra os dados de *" +
          fnome +
          "*" +
          " os são CPF=" +
          results[0].numcpf +
          ", Telefone=" +
          results[0].telefone +
          "\n [SIM] ou [NÂO]";
        response.json({ fulfillmentText: contato });
      }
      connection.end();
    });
  }

  if (NomedaIntent == "5_Atualizar_Sim") {
    var fnome = request.body.queryResult.outputContexts[0].parameters["nome"];
    var fnumcpf = request.body.queryResult.parameters["cpf"];
    var ftelefone = request.body.queryResult.parameters["telefone"];
    var fQuery =
      'update tb_cliente set numcpf="' +
      fnumcpf +
      '", telefone="' +
      ftelefone +
      '" where nome = "' +
      fnome +
      '"';
    connection.query(fQuery, function(error, results, fields) {
      if (results.changedRows == 0)
        response.json({
          fulfillmentText:
            "⚠ ocorreu um erro inesperado(51) ! Tente novamente, digite Atualizar."
        });
      else {
        var contato =
          "*" +
          fnome +
          "*" +
          ", agora seu NOVO CPF é " +
          fnumcpf +
          ", e seu NOVO TELEFONE é " +
          ftelefone;
        response.json({ fulfillmentText: contato });
      }
      connection.end();
    });
  }

  if (NomedaIntent == "5_Atualizar_Nao") {
    response.json({ fulfillmentText: "🤖 Ok! Os Dados não atualizado!!" });
  }

  if (NomedaIntent == "0_Encerrar") {
    response.json({
      fulfillmentText:
        "🤖 Conexão encerrada! Obrigado por Interagir aqui " + VerCanal()
    });
    connection.end();
  }

  function VerCanal() {
    var fNomeCanal = "no " + agent.requestSource;
    if (agent.requestSource == null) fNomeCanal = "neste canal !";

    return fNomeCanal;
  }
});*
