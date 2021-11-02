const app = require("../server");
const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
chai.use(require("chai-things"));
chai.should();

describe("registration", () => {
	it("register with no input", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(6);
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Email must be of valid email format.",
					param: "email",
					location: "body"
				});
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Email already exists.",
					param: "email",
					location: "body"
				});
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Display Name must contain at least 1 character.",
					param: "displayName",
					location: "body"
				});
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Password must contain at least 8 characters, numbers, and letters.",
					param: "password",
					location: "body"
				});
				res.body.errors.should.not.include.something.that.deep.equals({
					msg: "Please enter the same password.",
					param: "repeatedPassword",
					location: "body"
				});
				done();
			});
	})
	
	it("register with only display name", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "test"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(5);
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Email must be of valid email format.",
					param: "email",
					location: "body"
				});
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Email already exists.",
					param: "email",
					location: "body"
				});
				res.body.errors.should.not.include.something.that.deep.equals({
					value: "test",
					msg: "Display Name must contain at least 1 character.",
					param: "displayName",
					location: "body"
				});
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Password must contain at least 8 characters, numbers, and letters.",
					param: "password",
					location: "body"
				});
				res.body.errors.should.not.include.something.that.deep.equals({
					msg: "Please enter the same password.",
					param: "repeatedPassword",
					location: "body"
				});
				done();
			});
	})
	
	it("register with only wrong email format", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				email: "test"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(5);
				res.body.errors.should.include.something.that.deep.equals({
					value: "test",
					msg: "Email must be of valid email format.",
					param: "email",
					location: "body"
				});
				res.body.errors.should.not.include.something.that.deep.equals({
					value: "test",
					msg: "Email already exists.",
					param: "email",
					location: "body"
				});
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Display Name must contain at least 1 character.",
					param: "displayName",
					location: "body"
				});
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Password must contain at least 8 characters, numbers, and letters.",
					param: "password",
					location: "body"
				});
				res.body.errors.should.not.include.something.that.deep.equals({
					msg: "Please enter the same password.",
					param: "repeatedPassword",
					location: "body"
				});
				done();
			});
	})
	
	it("register with only correct email format", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				email: "test@test.com"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(4);
				res.body.errors.should.not.include.something.that.deep.equals({
					value: "test@test.com",
					msg: "Email must be of valid email format.",
					param: "email",
					location: "body"
				});
				res.body.errors.should.not.include.something.that.deep.equals({
					value: "test@test.com",
					msg: "Email already exists.",
					param: "email",
					location: "body"
				});
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Display Name must contain at least 1 character.",
					param: "displayName",
					location: "body"
				});
				res.body.errors.should.include.something.that.deep.equals({
					msg: "Password must contain at least 8 characters, numbers, and letters.",
					param: "password",
					location: "body"
				});
				res.body.errors.should.not.include.something.that.deep.equals({
					msg: "Please enter the same password.",
					param: "repeatedPassword",
					location: "body"
				});
				done();
			});
	})
})
